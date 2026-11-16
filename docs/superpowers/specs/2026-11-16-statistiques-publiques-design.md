# Page publique « Statistiques » dynamique — design

## Intention

La page publique `/statistiques` doit convaincre deux publics :

- **la DGALN et le comité d'investissement beta.gouv** : une preuve d'impact chiffrée, vivante, sourcée. La fiche beta.gouv d'Otelo renvoie vers cette page.
- **les acteurs potentiels** (DDT, EPCI, agences d'urbanisme, bureaux d'études) : la preuve sociale — « des territoires comme le mien, voire mes voisins, l'utilisent déjà, et ça sert à de vrais documents d'urbanisme » — pour les inciter à demander un accès.

Aujourd'hui la page est statique : chiffres codés en dur (82/89 DDT, 220 territoires, NPS 57 %, 7 500 / 14 000 / -10 000) et deux cartes PNG de juin 2025 (`apps/web/src/app/(unauthenticated)/statistiques/page.tsx`). Elle est périmée et invérifiable.

## Objectifs

- Remplacer les chiffres en dur par des chiffres calculés depuis la base, rafraîchis quotidiennement.
- Une carte de France interactive (zoom / dézoom, déplacement) des EPCI utilisant Otelo, avec leur nom au survol.
- Une lecture « à la beta.gouv » : chaque section porte une phrase qui énonce le chiffre clé, et chaque graphique a une transcription textuelle (accessibilité RGAA).
- Une section méthode : définition de chaque indicateur, date de mise à jour.
- Un appel à l'action vers la demande d'accès.

## Non-objectifs

- Pas d'indicateur « logements de construction évités » dans cette itération : il demande une méthode de calcul à part, défendable devant le comité. On affiche les réductions en % déjà calculées par `getTargetReductions`.
- Pas d'historisation (table d'instantanés + cron) : l'option B a été écartée pour l'instant ; elle pourra venir si un indicateur ne se reconstitue pas depuis les dates de création.
- Pas de NPS dynamique (pas de source en base) — voir « Laissé au constructeur ».
- Pas de refonte de la page admin.

## Anti-objectifs (échec même si « ça marche »)

- Exposer quoi que ce soit au niveau utilisateur (nom, email, structure) ou les chiffres de besoins d'un EPCI (flux, stock, besoins totaux de ses scénarios). Seuls le **nom de l'EPCI et son statut d'usage** sont publics.
- Compter les comptes de l'équipe Otelo (`ownerIsNotTeam` doit filtrer partout, comme dans l'admin).
- Une page lente ou qui tombe si l'API est indisponible.
- Des chiffres qui divergent de ceux de l'admin pour la même définition.

## Contraintes

- API NestJS ; toute route déclare son accès (`route-access.spec.ts`) → `@AllowAnonymous()`.
- Schémas Zod partagés dans `packages/shared/src/schemas/statistics/`, utilisés directement (`Z…` / `T…`), sans alias DTO.
- Filets de contrat : étendre `input-contract.spec.ts` / `openapi.integration-spec.ts` si la route y entre ; les lancer en `--ci` pour prouver qu'aucun contrat existant ne bouge.
- Front Next.js + DSFR (`@codegouvfr/react-dsfr`), Leaflet / react-leaflet + fond IGN déjà présents.
- La base ne relie pas un utilisateur à un EPCI : le statut d'un EPCI se déduit de ses simulations, pas des inscriptions.

## Approches considérées

- **A. Endpoint public agrégé + page régénérée quotidiennement (ISR) — retenue.** Réutilise les requêtes admin, peu de code nouveau, toujours à jour. Limite : les séries temporelles sont reconstituées depuis les dates de création (simulations, exports), pas d'historique pour les indicateurs non datés.
- **B. Instantané quotidien en base + endpoint public.** Historique complet et chiffres figés traçables, mais une table et un cron en plus, et l'historique ne commence qu'au déploiement. Écartée pour l'instant, compatible plus tard.
- **C. Chiffres saisis à la main.** Écartée : c'est la cause de l'obsolescence actuelle.

## Ce qui a été décidé

- Approche A.
- Les noms des EPCI sont affichés publiquement sur la carte.
- « DDT engagées » = départements où une DDT a lancé au moins une simulation (déduits des EPCI simulés). Une DDT inscrite sans simulation n'est pas comptée ; la section Méthode le dit.
- Le chiffre d'enquête « documents d'urbanisme influencés » et le chiffre calculé coexistent.
- La carte est zoomable / dézoomable (et déplaçable).

## Design

### API — `GET /public/statistics`

Nouveau contrôleur `PublicStatisticsController` dans le module `statistics`, `@AllowAnonymous()`, qui délègue à un `PublicStatisticsService` réutilisant les fragments SQL existants (`simulationsExportedIn`, `ownerIsNotTeam`, population du dernier RP, `getTargetReductions`, `getPlanningDocumentsUsage`). En-tête `Cache-Control: public, max-age=3600` ; la mise en cache principale est côté Next (ISR).

Réponse (`ZPublicStatistics` dans `packages/shared`) :

```ts
{
  generatedAt: string                // ISO
  keyFigures: {
    epcisWithSimulation: number      // EPCI ayant au moins une simulation non supprimée
    epcisWithExport: number          // EPCI ayant au moins un scénario exporté
    coveredPopulation: number        // population (dernier RP) des EPCI avec export
    coveredPopulationShare: number   // % de la population des EPCI de France
    planningDocuments: number        // dossiers d'études (epci_groups) déclarant PLH_PLUI / SCOT / AUTRES et ayant au moins un scénario exporté (choix du constructeur)
    engagedDepartments: number       // départements d'au moins un EPCI d'une simulation non supprimée d'un utilisateur `type = DDT`
    totalDepartments: number         // départements distincts de la table `epcis` (choix du constructeur)
  }
  targetReductions: TTargetReduction[]          // forme existante, scénarios exportés
  planningDocumentsByType: { key: 'PLH_PLUI' | 'SCOT' | 'AUTRES'; count: number }[]
  monthly: { month: string; simulations: number; exports: number; activeEpcis: number }[] // 24 derniers mois
  epcis: { code: string; name: string; department: string | null; region: string; status: 'SIMULATED' | 'EXPORTED' }[] // seuls les EPCI utilisateurs
}
```

- Période des agrégats : depuis le début (cumul), sauf `monthly`.
- Statut d'un EPCI : `EXPORTED` s'il apparaît dans un scénario exporté, sinon `SIMULATED` s'il apparaît dans une simulation non supprimée ; absent sinon.
- Le nom, le département (`department_name`) et la région (`COALESCE(region_name, region)`) de l'EPCI viennent de la table `epcis` : le GeoJSON statique ne porte que `{ code, nom }`. Ce sont des données publiques.
- Un scénario exporté puis supprimé reste compté : l'export a eu lieu. C'est la définition de la page admin Impact (`simulationsExportedIn`), qui fait référence pour le test de non-divergence. Le statut `SIMULATED` ne compte que les simulations non supprimées. *(choix du constructeur)*
- `planningDocumentsByType` reprend l'enum `PlanningDocumentType` (`PLH_PLUI`, `SCOT`, `AUTRES`) ; `AUCUN` et `NON_RENSEIGNE` ne sont pas affichés publiquement. *(choix du constructeur)*
- Aucun identifiant utilisateur, aucun chiffre de besoins, aucun compte de scénarios par EPCI.

### Front — page `/statistiques`

Server component, `fetch` non authentifié vers `${API_URL}/public/statistics` (comme `partage/[token]`) avec `next: { revalidate: 86400 }`. Rendu dynamique au premier accès plutôt qu'au `next build`, pour ne pas figer une version vide si l'API est injoignable au build. En cas d'échec, la page s'affiche avec un encart « statistiques momentanément indisponibles » et sans carte, sans erreur 500, et la réponse d'échec n'est pas mise en cache 24 h (revalidation courte, quelques minutes). *(choix du constructeur)*

Structure :

```
┌────────────────────────────────────────────────────────┐
│ H1 Statistiques · « Mis à jour le JJ/MM/AAAA »         │
│ Phrase phare : réduction médiane de vacance longue     │
│ visée dans les scénarios exportés                      │
│ [EPCI utilisateurs] [Population couverte] [Documents   │
│  d'urbanisme] [DDT engagées]                           │
├──────────────────────────────┬─────────────────────────┤
│ Carte de France des EPCI     │ Légende + panneau :     │
│ zoom / dézoom / déplacement  │ survol → nom, départ.,  │
│ couleur = statut             │ statut                  │
├──────────────────────────────┴─────────────────────────┤
│ Évolution mensuelle (barres) + transcription           │
│ Documents d'urbanisme par type (barres) + transcription│
│ Leviers hors construction : réductions visées (%)      │
├────────────────────────────────────────────────────────┤
│ Méthode (accordéon DSFR par indicateur)                │
│ CTA « Demander un accès »                              │
└────────────────────────────────────────────────────────┘
```

- La section « Une solution qui fait ses preuves » de l'accueil lit les mêmes données (même fetch ISR) pour « collectivités / EPCI utilisateurs ».
- Le chiffre « documents d'urbanisme influencés » issu de l'enquête de l'équipe est conservé, sur l'accueil et sur `/statistiques`, à côté du chiffre calculé `planningDocuments`. Chacun porte son libellé distinct et sa source dans la section Méthode : « déclaratif, enquête auprès des utilisateurs formés » pour l'un, « dossiers d'études déclarant un document d'urbanisme » pour l'autre. Le chiffre d'enquête reste une constante du front, avec sa date.
- Les PNG `acces_collectivite.png` / `acces_ddt.png` sont supprimés s'ils ne servent plus ailleurs.

### Carte

- Extraire de `components/admin/pilotage-deployment-map.tsx` la partie générique (MapContainer, fond IGN, chargement GeoJSON, recadrage France, tooltips) vers `components/map/epci-map.tsx`, paramétrée par une fonction de style et un contenu de tooltip. La carte admin et la carte publique l'utilisent toutes deux.
- GeoJSON : `/geojson/epci-1000m.geojson` existant (statique, mis en cache par le navigateur).
- Chargement côté client uniquement (`next/dynamic`, `ssr: false`), Leaflet ne supportant pas le SSR.
- Contrôles : zoom +/−, molette, déplacement, bouton « Recentrer sur la France ». Le GeoJSON contient 23 EPCI d'outre-mer : des boutons de raccourci (Guadeloupe, Martinique, Guyane, La Réunion, Mayotte) recentrent la carte dessus ; pas de limite de déplacement bloquant l'outre-mer. *(choix du constructeur)*
- Couleurs DSFR : `EXPORTED` bleu France foncé, `SIMULATED` bleu clair, autres EPCI gris ; légende textuelle (pas d'information portée par la seule couleur).
- Alternative accessible : lien « Voir la liste des EPCI utilisateurs » (tableau DSFR trié par région / département) sous la carte.

### Tests

- Vérifier que les codes du GeoJSON correspondent à ceux de la table `epcis` (millésime) ; un EPCI utilisateur absent du GeoJSON reste dans le tableau accessible.
- API : test d'intégration du service sur une base de test — statuts EPCI corrects, comptes équipe exclus, aucun champ hors schéma ; `route-access.spec.ts` passe ; filets de contrat en `--ci`.
- Front : test de rendu de la page avec données factices et avec API en échec.

## Laissé au constructeur

- Les libellés exacts des cartes de chiffres et des phrases d'introduction.
- Le découpage précis du composant carte extrait, tant que la carte admin garde son comportement.
- Le choix de la librairie de barres déjà présente dans le front pour les graphiques.
