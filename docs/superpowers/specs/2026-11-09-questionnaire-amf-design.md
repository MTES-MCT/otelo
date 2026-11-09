# Questionnaire congrès AMF : « Votre besoin en logements en 3 minutes »

## Intention

Au congrès de l'AMF (dans quelques semaines), un QR code sur le stand Otelo ouvre une page publique `/amf`. Un élu y répond à quelques questions sans jargon et obtient une première estimation simplifiée de son besoin en logements d'ici 2036 pour son EPCI.

Le but n'est pas la précision. Il s'agit :
- d'engager le dialogue sur le stand ;
- de donner envie à l'élu de transmettre à son collaborateur habitat (DGS, chef de service habitat) pour qu'il aille sur Otelo affiner un vrai scénario ;
- de tester les besoins des élus sur un parcours simplifié.

L'approche est pédagogique. On parle en **habitants** et non en ménages, et on évite le jargon.

## Objectifs

- Un parcours mobile first (scan de QR code), responsive, bouclé en environ 3 minutes.
- Un résultat calculé par le vrai moteur Otelo, avec des paramètres simplifiés.
- La collecte de l'e-mail de l'élu (obligatoire) et des contacts à qui il veut partager, pour une relance ultérieure par l'équipe.
- La traçabilité des simulations faites au congrès via une clé d'API dédiée (listing par clé déjà existant : `GET /external/simulations`, `ApiConsumerUsageDaily`).

## Non-objectifs

- Aucun envoi d'e-mail (ni à l'élu, ni aux contacts partagés). Ce sera fait plus tard, à la main ou dans un second temps.
- Pas de reprise de la simulation dans Otelo : le questionnaire sert uniquement de déclencheur, et le collaborateur repart de zéro.
- Pas de mécanisme de coupure du lien après le congrès : le lien reste actif. La désactivation se fera plus tard (par exemple en désactivant la clé d'API, `ApiConsumer.active`).
- Pas d'écran d'administration des leads : les données sont consultées en base.

## Anti-objectifs (échec même si « ça marche »)

- Du jargon visible (« ménages », « B2 », « flux/stock », « Omphale », « desserrement »…).
- Une page inutilisable sur téléphone, ou trop longue pour être faite debout sur un stand.
- Une clé d'API exposée dans le navigateur.
- Des chiffres faux par construction, par exemple des taux par défaut à 0 au lieu des taux observés (voir Contraintes).
- Un résultat dont l'addition affichée ne tombe pas juste.

## Parcours

Une question par écran, avec une barre de progression et un retour arrière possible.

1. **Intro** : « Votre besoin en logements en 3 minutes ! Obtenez une première estimation simplifiée de votre besoin en logement d'ici 2036 sur votre territoire en seulement 5 questions. » Bouton « Commencer ».
2. **Quel est votre EPCI ?** Autocomplétion par nom d'EPCI ou de commune. On réutilise le composant existant (`apps/web/src/components/simulations/autocomplete/autocomplete-input.tsx` et `apps/web/src/hooks/use-geoapi-search.ts`, qui interroge geo.api.gouv.fr et exclut déjà l'Île-de-France). Un EPCI absent de la table `epcis` n'est pas sélectionnable : un message invite à se rendre sur Otelo. Un EPCI marqué `Epci.noInseeProjection` (environ 110 EPCI, dont 9 de Dordogne) **reste sélectionnable**, comme dans l'appli. Un court avertissement précise alors que les projections démographiques de ce territoire sont fragiles (même principe que `FragileProjectionAlert`). Décision de l'équipe.
3. **D'ici 2036, selon vous, la population de votre territoire connaîtra :** trois options relatives, chacune affichée avec l'évolution signée en habitants entre l'année de base et 2036 pour l'EPCI choisi, unité comprise :
   - « Une évolution plus favorable (+25 140 habitants) » → `PH_C`
   - « Dans la tendance actuelle (+8 670 habitants) » → `Central_C`
   - « Une évolution moins favorable (−7 150 habitants) » → `PB_C`

   Les chiffres affichés viennent de `demographic_evolution_population` (colonnes `haute`, `central`, `basse`, en habitants). Le calcul, lui, utilise le scénario ménages correspondant (`demographic_evolution_omphale`, suffixe `C` = desserrement tendanciel, fixé et jamais demandé). Si la projection basse est absente pour l'EPCI (colonne nulle), l'option « Une évolution moins favorable » est masquée. C'est le même principe que le grisage dynamique de l'appli actuelle.
4. **D'après vous, est-ce une priorité de remobiliser des logements vacants ?**
   - Oui, c'est prioritaire → −20 %
   - Oui, parmi d'autres mesures → −10 %
   - Ça n'est pas le plus utile pour mon territoire → 0 %

   Le pourcentage est une réduction relative du taux de vacance longue durée observé, comme dans l'appli (`create-long-term-accomodation-range.tsx`) : `b2_tx_vacance_longue = observé × (1 − pct)`. Le taux de vacance courte reste à sa valeur observée.
5. **Le mal-logement est-il une problématique importante sur votre territoire ?**
   - Oui → paramètres de stock par défaut d'Otelo (`SCENARIO_DEFAULTS`, horizon de résorption `b1_horizon_resorption` = 2050 inchangé, donc seule la part au prorata jusqu'en 2036 est comptée).
   - Non → besoin lié au mal-logement nul (le `totalStock` du résultat doit valoir 0).
6. **Quel est votre point de vue sur les résidences secondaires sur votre territoire ?**
   - Ce n'est pas un sujet → taux observé inchangé
   - Je souhaite les réguler → `b2_tx_rs = observé × 0,95`
   - Je souhaite les développer → `b2_tx_rs = observé × 1,05`

   Il n'existe pas de paramètre distinct pour les meublés touristiques : ils sont inclus dans le taux de résidences secondaires.
7. **Votre e-mail** (obligatoire pour voir les résultats). Sous le champ figure la mention : « Votre e-mail sera utilisé par l'équipe Otelo pour vous recontacter au sujet de votre besoin en logement », avec un lien vers la page Données personnelles existante. Il n'y a pas de case à cocher (choix validé par l'équipe, à confirmer avec le référent RGPD).
8. **Résultats** (voir plus bas).
Une fois les résultats affichés, on ne revient plus aux questions. Un bouton « Refaire une simulation » repart de l'intro. Chaque parcours terminé crée **une** simulation et **un** lead, liés un à un (choix du concepteur : comptage simple par clé, et les contacts partagés sont rattachés sans ambiguïté au lead du parcours en cours).

9. **« À qui souhaitez-vous partager ces résultats ? »** Ce formulaire est sous les résultats, sur le même écran. L'élu saisit une fonction (libre, par exemple « DGS », « Chef de service habitat ») et un e-mail, et peut ajouter plusieurs contacts. Les contacts sont enregistrés, sans aucun envoi, puis le message « Merci, vos contacts ont bien été enregistrés. » s'affiche (il ne promet aucun envoi). Cette étape est facultative.
10. **CTA** : un bouton vers la page d'accueil d'Otelo.

## Écran de résultats

Il reprend le modèle « Détail des besoins en logements » de l'appli, mais avec **seulement les titres et les chiffres** (pas de texte explicatif, pas de sous-détail). Sur mobile, les blocs s'empilent verticalement, séparés par les signes :

```
Besoin en construction d'ici 2036 : 4 800 logements
(soit environ 340 par an)
=  Évolution de la population            3 900
±  Logements vacants                      500
±  Résidences secondaires                  200
+  Résorption du mal-logement            1 200
```

- Le total sur la période est affiché en grand, avec la moyenne annuelle en dessous (total ÷ (2036 − année de base)).
- Les montants sont arrondis à la dizaine. L'addition affichée doit tomber juste : « Évolution de la population » est calculée comme le reste (total arrondi − autres blocs arrondis).
- Les blocs se calculent à partir de `buildEstimationBreakdown` (`packages/shared/src/calculations/estimation-breakdown.ts`), avec `B` = mal-logement, `G − D` = vacants (net : affiché en « − » quand des logements vacants sont remobilisés, en « + » quand la vacance augmente avec le parc, ce qui est le cas probable avec la réponse 0 %), `E − H` = résidences secondaires (net, signe affiché), et « Évolution de la population » = le reste. Elle absorbe donc démographie, fluidité, renouvellement et surplus.
- **Besoin nul ou négatif** (territoire en décroissance) : le moteur ramène le total à 0, et `buildEstimationBreakdown` renvoie tous les blocs à 0. L'écran affiche alors « 0 logement à construire d'ici 2036 » et masque les blocs de détail. Il ajoute le message : « Selon ces hypothèses, votre parc actuel couvre les besoins d'ici 2036. Otelo peut aider votre chef de service habitat à travailler la qualité du parc et la remobilisation des logements. » Décision de l'équipe, cohérente avec l'affichage de l'appli.
- Le bloc mal-logement reste affiché à 0 si l'élu a répondu « Non ». Il en va de même pour le bloc résidences secondaires quand il vaut 0.
- La mention suivante est affichée sous les chiffres : « Ces premiers chiffres ne sont pas encore précis. Invitez votre chef de service habitat à les affiner dans Otelo pour définir un scénario pleinement pertinent pour votre territoire. »

## Choix techniques décidés

- **Page publique** : `/amf`, dans `apps/web/src/app/(unauthenticated)/`, en DSFR. La mise en page pleine largeur de `partage/[token]` (`(unauthenticated)/layout.tsx`) sert de modèle.
- **Authentification par une clé d'API dédiée au congrès** : on crée un `ApiConsumer` (module `consumers`). La clé est stockée dans une variable d'environnement du serveur web (par exemple `AMF_API_KEY`) et n'est **jamais envoyée au navigateur**. Le navigateur appelle des route handlers Next (`apps/web/src/app/api/amf/*`), qui relaient vers l'API Nest avec la clé. C'est le même schéma que `apps/web/src/app/api/contact/route.ts`.
- **Simulations enregistrées** et rattachées à l'`ApiConsumer` du congrès, comme les simulations de l'API externe, pour qu'elles apparaissent dans le listing par clé.
- **Paramètres fixes** :
  - `projection` = 2036 ;
  - millésime = millésime du data pack actif (`DataPackVersionsService.getActive()`, et non la valeur `'2021'` codée en dur dans `preview.service.ts`) ;
  - taux par EPCI = taux observés (`AccommodationRatesService.getAccommodationRates(epciCode, millesime)`), seulement modifiés par les réponses ;
  - tous les autres paramètres aux valeurs par défaut d'Otelo.
- **Stockage des leads** : nouvelle table pour l'élu (e-mail, simulation liée, code EPCI, réponses brutes, date) et nouvelle table pour les contacts partagés (lead lié, fonction, e-mail, date), avec une migration Prisma. Les leads doivent survivre à la suppression de la clé ou des simulations (une suppression d'`ApiConsumer` supprime ses simulations en cascade) : `AmfLead.simulationId` est nullable, unique, avec `onDelete: SetNull`. Les contacts restent supprimés en cascade avec leur lead. Pour couper le questionnaire, on désactive la clé (`ApiConsumer.active = false`) plutôt que de la supprimer ; cette clé ouvre aussi l'API `/external`.

## Contraintes et pièges connus

- **Les taux à 0 ne sont pas neutres.** Si `b2_tx_*` est omis à la création via l'API externe, les valeurs par défaut Prisma valent 0, ce qui fausse le calcul (vacance cible 0 %, RS 0 %). Il faut toujours partir des taux observés.
- **Le module de calcul est request-scoped.** `CalculationContext` lit `request.params.simulationId` pour déterminer le millésime et le coefficient (`calc/needs-calculation.module.ts`). La route publique doit en tenir compte : le plus simple est de suivre le chemin de `ExternalService.createSimulation`, qui crée la simulation puis la calcule.
- **Les EPCI sans projection** (`noInseeProjection`) et sans projection basse (colonnes `pb_*` / `basse` nulles) existent (par exemple 9 EPCI de Dordogne sans projection basse, qui sont aussi marqués `noInseeProjection`). Voir la note sur les colonnes nulles et l'import CSV.
- **Routes** : toute nouvelle route Nest doit déclarer `@AllowAnonymous` + `@UseGuards(ApiKeyGuard)` (ou équivalent), sinon `route-access.spec.ts` échoue. Il ne faut pas utiliser `@Public` (décorateur non lu).
- **Débit** : un rythme de stand modeste, mais une page publique. Il faut une limite par IP (`@Throttle`) sur les routes du questionnaire, et le tracker throttler s'appuie sur `X-Forwarded-For`, qui doit être transmis par les route handlers Next.
- **Validation** : on utilise les schémas Zod directs (`Z…` / `T…`), conformément aux conventions du projet.
- **Contrats d'API** : la forme publiée de l'API externe (`CreateSimulationDto`…) ne doit pas changer.

## Laissé au constructeur

- Le découpage exact des routes. Deux voies sont possibles : un petit module Nest `amf` qui reçoit les réponses brutes et fait la traduction en scénario côté serveur (recommandé, pour que les taux observés et la logique restent côté API), ou des appels directs à `/external/*` depuis les route handlers Next.
- La manière de mettre le stock à zéro pour « Non » au mal-logement : paramètres désactivés ou mise à zéro après calcul. L'exigence est seulement que le résultat soit cohérent, avec `totalStock` = 0 et un total qui reste juste.
- Le nommage des tables et des colonnes, et le nom de la simulation enregistrée (par exemple « AMF – <nom EPCI> »).
- L'état du formulaire entre les écrans (state client, nuqs…), les pictos et le détail visuel DSFR.
- La validation des e-mails et les messages d'erreur.
- Les tests, selon les conventions du dépôt (`@golevelup/ts-jest`, snapshots de contrat si une route est ajoutée à l'API externe).
