# Plan de tracking Matomo — Otelo

Catalogue vivant des événements envoyés à Matomo. **Toute instrumentation ajoutée au code doit apparaître ici**, avec son identifiant stable et son fichier source.

## Principes

- **Matomo mesure le comportement, pas les chiffres officiels.** Tout ce qui est comptable en base (connexions, scénarios, exports, partages) est mesuré en base et exposé dans `/admin`. Matomo répond aux questions que la base ne peut pas trancher : parcours, abandons, pages lues, recherches sans résultat.
- **Aucune donnée identifiante.** Pas d'email, pas d'identifiant utilisateur, pas de token. Le mode exempté CNIL revendiqué sur `/donnees-personnelles` en dépend.
- **Le tracking ne casse jamais un parcours.** `trackEvent` est un no-op hors production et en session usurpée.

## Convention de nommage

| Champ | Convention | Exemple |
|---|---|---|
| `category` | nom français, Title Case, issu de l'union fermée `MatomoEventCategory` | `Partage` |
| `action` | verbe ou groupe nominal en minuscules, sans accent | `activation partage` |
| `name` | identifiant contextuel | `choix-du-territoire`, `succes` |
| `value` | valeur numérique agrégeable | `12` (nombre d'EPCI) |

## Dimensions personnalisées

Portée **visite**, à créer côté Matomo avec ces index exacts (`MATOMO_DIMENSIONS` dans `tracking.ts`).

| Index | Nom | Valeurs | Émis par |
|---|---|---|---|
| 1 | `user_type` | 13 valeurs de `UserType` | `components/tracking-session.tsx` |
| 2 | `user_region` | région de l'utilisateur | `components/tracking-session.tsx` |
| 3 | `is_authenticated` | `oui` — l'absence de valeur signifie « visiteur non connecté » | `components/tracking-session.tsx` |

## Catalogue

Statut : ✅ implémenté · ⏳ prévu.

### Partage

| ID | Action | Name | Source | Statut |
|---|---|---|---|---|
| P1 | `activation partage` / `desactivation partage` | — | `components/collaboration/share-simulation-modal.tsx` | ✅ |
| P2 | `copie lien` | — | `components/collaboration/share-simulation-modal.tsx` | ✅ |
| P3 | `consultation lien partage` | domaine du référent | `components/collaboration/shared-view-tracker.tsx` | ✅ |

### Infographie

| ID | Action | Name / Value | Source | Statut |
|---|---|---|---|---|
| I1 | `selection jeu de donnees` | libellé du jeu de données | `components/data-visualisation/select-data-type.tsx` | ✅ |
| I2 | `filtre territoire` | value = nombre d'EPCI | `components/charts/data-visualisation/` | ⏳ |
| I3 | `telechargement graphique` | nom de fichier | `hooks/use-chart-download.ts` | ✅ |

### Simulation — entonnoir de création

Clé de l'entonnoir : les six `WizardStepSlug` de `components/simulations/settings/wizard-steps.ts`. **Ne jamais dériver l'entonnoir des URLs** : l'état du wizard vit dans les paramètres d'URL via nuqs et `NextStepLink` les recopie d'une étape à l'autre.

> ⛔ `wizard-steps.ts` et `wizard-step-tracker.tsx` arrivent avec le wizard, resté sur `dev` : les événements marqués ⛔ ci-dessous ne sont pas encore émis.

| ID | Action | Name / Value | Statut |
|---|---|---|---|
| S1 | `etape wizard` | slug de l'étape | ⛔ `components/simulations/settings/wizard-step-tracker.tsx` (avec le wizard) |
| S2 | `methode territoire` | `existing-group` / `bassin-habitat` / `custom-selection` | ⏳ |
| S3 | `scenario population` | `basse` / `centrale` / `haute` | ⏳ |
| S4 | `scenario omphale` | `Central_C`… (9 valeurs) | ✅ `hooks/use-create-simulation.ts` |
| S5 | `import projection a facon` | `succes` / `erreur` | ⏳ |
| S6 | `creation scenario` | value = nombre d'EPCI | ✅ `hooks/use-create-simulation.ts` |
| S7 | `clic suivant bloque` | slug de l'étape | ⏳ |

### Simulation — exploitation des résultats et itération

| ID | Action | Name | Statut |
|---|---|---|---|
| R1 | `comparaison scenarios` | value = nombre de scénarios du dossier | ✅ `results/header/simulation-header-segmented-controls.tsx` |
| R2 | `elaborer autre scenario` | — | ⏳ |
| R3 | `onglet resultats` | `synthese` / `epci` | ⏳ |
| R4 | `bascule graphique tableau` | `demographie` / `mal-logement` | ⏳ |
| R5 | `section resultats` | ancre de section | ⏳ |
| R6 | `ouverture parametrage` | — | ⏳ |
| R7 | `drawer scot` | value = nombre d'EPCI | ⏳ |
| M1 | `etape modification demographique` | slug de l'étape | ⛔ `components/simulations/settings/wizard-step-tracker.tsx` (avec le wizard) |
| M2 | `affiner mal-logement` | — | ⏳ |
| M3 | `etape mal-logement` | slug de l'étape | ⏳ |
| M4 | `validation parametrage` | `demographique` / `mal-logement` | ⏳ |

### Aide, engagement, authentification

| ID | Catégorie | Action | Name / Value | Statut |
|---|---|---|---|---|
| A1 | Aide | `ouverture tutoriel` | slug de l'étape / `resultats`, value = nb de bulles | ⛔ `tutorial/use-tutorial.ts` (avec le mode tuto) |
| A2 | Aide | `fin tutoriel` | `termine` / `abandonne`, value = n° de bulle | ⛔ `tutorial/use-tutorial.ts` (avec le mode tuto) |
| A3 | Aide | `question guide` | ancre du guide | ⏳ |
| A4 | Aide | `lien source de donnees` | ancre | ⏳ |
| A5 | Aide | `ouverture faq` | libellé de la question | ⏳ |
| E1 | Engagement | `lien externe` | `quiz` / `webinaire` / `demarches-simplifiees` | ⏳ |
| E2 | Engagement | `feedback` | `envoi` / `report`, value = note | ✅ `feedback/feedback-banner.tsx` |
| E3 | Engagement | `signalement probleme` | — (le chemin de la page part dans le mail, jamais dans Matomo) | ✅ `components/report-issue-button.tsx` |
| N1 | Authentification | `connexion` | `succes` / `erreur` / `proconnect` | ⏳ |
| N2 | Authentification | `selection type utilisateur` | valeur de `UserType` | ✅ `auth/user-type-selection-modal.tsx` |
| N3 | Authentification | `mur acces` | `telechargement acte` / `demarches-simplifiees` (l'affichage est une vue de page) | ✅ `auth/unauthorized-actions.tsx` |
| X1 | Simulation | `erreur` | `import-csv` / `projection-manquante` / `acces-refuse` / `token-partage-invalide` | ⏳ |
| T1 | Territoires voisins | `recherche` / `categorie` | code EPCI / catégorie de proximité | ⏳ |

### Recherche interne

Poussée via `trackSiteSearch` (rapport natif Matomo, expose les recherches sans résultat) plutôt que comme événement.

| Point d'appel | Catégorie | Statut |
|---|---|---|
| Autocomplétion territoire du wizard | `territoire` | ✅ `simulations/autocomplete/autocomplete-input.tsx` |
| Autocomplétion des infographies | `infographie` | ✅ idem |
| Recherche de `/sources-de-donnees` | `source` | ⏳ |
| Autocomplétion de `/territoires-voisins` | `voisins` | ✅ idem |

## Limites connues

- **Sessions usurpées** : `setTrackingDisabled` est positionné par `<TrackingSession />`, qui monte après l'effet de `<Matomo />`. La toute première vue de page d'une session usurpée peut donc être comptée ; tous les événements suivants sont exclus. Le décompte exact des connexions se fait en base (`login_events`), qui exclut les usurpations de façon fiable.
- **Liens de partage** : le chemin `/partage/<token>` est réécrit en `/partage/[token]` avant émission, et le référent est vidé sur cette route. Deux liens de partage différents sont donc indistinguables dans Matomo — c'est voulu. Le compteur de consultations par scénario vit en base (`SimulationShareLink.viewCount`).
- **Bloqueurs de traqueurs** : 20 à 30 % des visites ne remontent pas. Ne jamais utiliser un chiffre Matomo comme donnée officielle.
- **Recherche interne** : une recherche n'est remontée qu'après 1,2 s de stabilité de la saisie et au moins 3 caractères, sinon chaque frappe compterait comme une recherche distincte.
- **Fin de tutoriel** : un tuto interrompu par une navigation n'est compté ni comme terminé ni comme abandonné — seule une fermeture explicite ou la dernière bulle produit un événement.
