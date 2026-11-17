# Questionnaire congrès AMF : plan d'implémentation

> **Pour les agents :** sous-skill requis : superpowers:subagent-driven-development (recommandé) ou superpowers:executing-plans pour exécuter ce plan tâche par tâche. Les étapes utilisent des cases à cocher (`- [ ]`) pour le suivi.

**Objectif :** une page publique `/amf`, mobile first, où un élu répond à 5 questions et à son e-mail, puis obtient une estimation simplifiée de son besoin en logements à 2036, calculée par le moteur Otelo avec une clé d'API dédiée.

**Architecture :**
- **API.** Un module Nest `amf` (`@AllowAnonymous` + `ApiKeyGuard` + `@Throttle`) traduit les réponses brutes en scénario. Il part des taux observés de l'EPCI, crée la simulation via `ExternalService.createSimulation` (elle est ainsi rattachée à l'`ApiConsumer` du congrès), enregistre le lead, puis renvoie des blocs de résultat déjà calculés et arrondis.
- **Web.** Les route handlers Next (`/api/amf/*`) relaient vers l'API en ajoutant la clé, lue dans `AMF_API_KEY` côté serveur. La page est un composant client à étapes.

**Stack :** NestJS 12, Prisma, Zod (schémas directs `Z…`/`T…`), Jest + `@golevelup/ts-jest`, Next.js 16 App Router, `@codegouvfr/react-dsfr`, TanStack Query.

**Spec :** `docs/superpowers/specs/2026-11-09-questionnaire-amf-design.md`

## Contraintes globales

- Horizon fixe : `projection = 2036`.
- Millésime = `DataPackVersionsService.getActive().millesime` (jamais `'2021'` en dur). L'année de base vaut `Number(millesime)`.
- Démographie : `plus` → `PH_C`, `tendance` → `Central_C`, `moins` → `PB_C`. Le suffixe ménages est toujours `C`.
- Vacance : `prioritaire` = −20 %, `parmi-autres` = −10 %, `non` = 0 %. Formule : `b2_tx_vacance_longue = observé × (1 − pct)`. La vacance courte reste à sa valeur observée, et `b2_tx_vacance = longue + courte`.
- Résidences secondaires : `neutre` ×1, `reguler` ×0,95, `developper` ×1,05, appliqués au `txRs` observé.
- Taux de renouvellement : `b2_tx_disparition` / `b2_tx_restructuration` = taux observés. Aucun `b2_tx_*` ne doit être omis : la valeur par défaut Prisma vaut 0 et fausse le calcul.
- Mal-logement « Non » : la neutralisation passe par les paramètres de scénario (et non par une mise à zéro après calcul), pour que la simulation enregistrée reste cohérente :
  ```
  b11_sa=false, b11_fortune=false, b11_hotel=false, b11_etablissement=[], b11_part_etablissement=0,
  b12_cohab_interg_subie=0, b12_heberg_particulier=false, b12_heberg_temporaire=false,
  b13_acc=false, b13_plp=false, b13_taux_reallocation=100, b14_taux_reallocation=100, b15_taux_reallocation=100
  ```
  « Oui » : aucun paramètre de stock n'est transmis (les valeurs par défaut Prisma s'appliquent, `b1_horizon_resorption = 2050`).
- Les EPCI `noInseeProjection` restent autorisés et sont signalés par `fragileProjection: true`. Un code absent de la table `epcis` renvoie 404.
- Toute route Nest déclare `@AllowAnonymous()` + `@UseGuards(ApiKeyGuard)`. Ne pas utiliser `@Public`.
- La clé d'API ne doit jamais atteindre le navigateur (pas de `NEXT_PUBLIC_`).
- Aucun jargon visible côté web : les mots « ménages », « flux », « stock », « B2 », « Omphale » et « desserrement » sont interdits.
- Libellés et textes exacts : ceux de la spec (intro, questions, mention de résultat, mention e-mail, message pour un besoin nul).
- Commits : une ligne, sans trailer ni footer.
- La forme publiée de l'API externe (`CreateSimulationDto`, etc.) ne change pas.

## Points de vigilance en revue

1. **Projection basse nulle** pour l'EPCI (par exemple en Dordogne) : `populationChanges.basse = null`, l'option « Moins d'habitants » est masquée, et un `demography: 'moins'` reçu malgré tout est refusé (400). Tests : Tâche 3 (`getEpci`) et Tâche 4 (`createSimulation`).
2. **Besoin total ≤ 0** (EPCI écarté du total par le moteur) : `total = 0`, `blocks = null`, et le web affiche le message dédié. Tests : Tâche 2 et Tâche 6.
3. **Taux observés absents** (EPCI sans ligne filocom : taux à 0 renvoyés par `getAccommodationRates`) : on calcule quand même, sans planter, et le résultat suit les mêmes règles. Test : Tâche 4.
4. **Saisie par commune** : l'autocomplétion renvoie une commune. On utilise alors son `codeEpci`, et une commune sans `codeEpci` n'est pas sélectionnable. Vérification manuelle : Tâche 6.
5. **Double envoi** (double tap mobile sur « Voir mes résultats ») : le bouton est désactivé pendant la requête, pour ne créer qu'une seule simulation. Vérification manuelle : Tâche 6.

---

### Tâche 0 : branche et spec

- [ ] **Étape 1 :** `git switch -c feat/questionnaire-amf` depuis `dev`.
- [ ] **Étape 2 :** commiter la spec et ce plan.
```bash
git add docs/superpowers/specs/2026-11-09-questionnaire-amf-design.md docs/superpowers/plans/2026-11-09-questionnaire-amf.md
git commit -m "docs: spec et plan du questionnaire congrès AMF"
```

---

### Tâche 1 : traduction des réponses en scénario (fonction pure)

**Fichiers :**
- Créer : `apps/api/src/amf/amf.schemas.ts`
- Créer : `apps/api/src/amf/amf-scenario.ts`
- Test : `apps/api/src/amf/amf-scenario.spec.ts`

**Interfaces :**
- Produit (`amf.schemas.ts`) :
  ```ts
  export const ZAmfAnswers = z.object({
    epciCode: z.string().regex(/^\d{9}$/),
    demography: z.enum(['plus', 'tendance', 'moins']),
    vacancy: z.enum(['prioritaire', 'parmi-autres', 'non']),
    badHousing: z.boolean(),
    secondaryResidences: z.enum(['neutre', 'reguler', 'developper']),
  })
  export const ZAmfCreateSimulationBody = ZAmfAnswers.extend({ email: z.email() })
  export type TAmfAnswers / TAmfCreateSimulationBody
  ```
- Produit (`amf-scenario.ts`) :
  ```ts
  export const AMF_HORIZON = 2036
  export type TObservedRates = { longTermVacancyRate: number; shortTermVacancyRate: number; txRs: number; restructuringRate: number; disappearanceRate: number }
  export function buildAmfSimulationBody(answers: TAmfAnswers, rates: TObservedRates, millesime: string, epciName: string): TCreateSimulationBody
  ```
  `TCreateSimulationBody` vient de `~/external/external.dto`. Valeurs fixes : `name = "AMF – ${epciName}"`, `epci = [{ code }]`, `scenario.epcis[code].baseEpci = true`.

- [ ] **Étape 1 : écrire les tests qui échouent** (`describe('buildAmfSimulationBody')`). Taux d'entrée : `{ longTermVacancyRate: 0.05, shortTermVacancyRate: 0.03, txRs: 0.2, restructuringRate: 0.001, disappearanceRate: 0.002 }`, millésime `'2022'`.
  - `it('mappe plus/tendance/moins vers PH_C/Central_C/PB_C')` → `scenario.b2_scenario` vaut respectivement `'PH_C'`, `'Central_C'`, `'PB_C'`.
  - `it('fixe projection 2036 et le millésime actif')` → `scenario.projection === 2036`, `scenario.millesime === '2022'`.
  - `it('réduit la vacance longue de 20 % / 10 % / 0 %')` → `b2_tx_vacance_longue` ≈ `0.04` / `0.045` / `0.05` (`toBeCloseTo`). `b2_tx_vacance_courte === 0.03`, et `b2_tx_vacance` ≈ longue + 0.03.
  - `it('applique ×0,95 / ×1 / ×1,05 au taux de résidences secondaires')` → ≈ `0.19` / `0.2` / `0.21`.
  - `it('reprend les taux de renouvellement observés')` → `b2_tx_disparition === 0.002`, `b2_tx_restructuration === 0.001`.
  - `it('ne transmet aucun paramètre de stock si mal-logement = oui')` → aucune clé `b11_*`, `b12_*`, `b13_*`, `b14_*`, `b15_*` dans `scenario`.
  - `it('neutralise le stock si mal-logement = non')` → `scenario` contient exactement les valeurs des Contraintes globales (`toMatchObject`).
  - `it('nomme la simulation et marque l’EPCI de base')` → `name === 'AMF – CC Test'` et `scenario.epcis['200040715'].baseEpci === true`.
- [ ] **Étape 2 :** `pnpm --filter api test -- amf-scenario` → ÉCHEC (module introuvable).
- [ ] **Étape 3 :** implémenter les schémas et `buildAmfSimulationBody`. Les tables de correspondance (démographie, pourcentages) sont des constantes en `as const`.
- [ ] **Étape 4 :** `pnpm --filter api test -- amf-scenario` → SUCCÈS.
- [ ] **Étape 5 :** `git commit -m "feat(api): traduire les réponses du questionnaire AMF en scénario"`

---

### Tâche 2 : blocs de résultat (fonction pure)

**Fichiers :**
- Créer : `apps/api/src/amf/amf-result.ts`
- Modifier : `apps/api/src/amf/amf.schemas.ts` (ajouter `ZAmfResult`)
- Test : `apps/api/src/amf/amf-result.spec.ts`

**Interfaces :**
- Consomme : `buildEstimationBreakdown`, `EstimationBreakdownInput` depuis `@otelo/shared` ; `AMF_HORIZON`.
- Produit :
  ```ts
  export const ZAmfResult = z.object({
    baseYear: z.number(), horizon: z.number(),
    total: z.number(), annualAverage: z.number(),
    blocks: z.object({ population: z.number(), vacancy: z.number(), secondaryResidences: z.number(), badHousing: z.number() }).nullable(),
  })
  export function buildAmfResult(results: EstimationBreakdownInput & { total: number }, epciCode: string, baseYear: number): TAmfResult
  ```
  Convention de signe : chaque bloc est une contribution signée, avec `total === population + vacancy + secondaryResidences + badHousing`. On a `vacancy = D − G` (négatif quand des logements sont remobilisés) et `secondaryResidences = E − H`.

Algorithme (non déterminé par la signature) :
```
r10 = x => Math.round(x / 10) * 10
b = buildEstimationBreakdown(results, { epciCode }).values
rawTotal = results.epcisTotals.find(e => e.epciCode === epciCode)?.total ?? 0
if rawTotal <= 0 → { total: 0, annualAverage: 0, blocks: null }
total = r10(rawTotal)
vacancy = r10(b.vacancyIncrease - b.vacancyRemobilised)
secondaryResidences = r10(b.secondaryIncrease - b.secondaryDecrease)
badHousing = r10(b.badHousing)
population = total - vacancy - secondaryResidences - badHousing
annualAverage = Math.round(rawTotal / (AMF_HORIZON - baseYear))
```

- [ ] **Étape 1 : écrire les tests qui échouent.** Fixture d'un EPCI `'200040715'` avec `epcisTotals[0] = { total: 4817, totalFlux: 3600 }` et `flowRequirement.epcis[0].totals = { demographicEvolution: 3900, renewalNeeds: -150, secondaryResidenceAccomodationEvolution: 203, shortTermVacantAccomodation: 147, longTermVacantAccomodation: -500 }` :
  - `it('arrondit le total à la dizaine et calcule la moyenne annuelle')` → `total === 4820`, `annualAverage === Math.round(4817 / 14)` (base 2022).
  - `it('signe les blocs vacants et résidences secondaires')` → `vacancy === -500`, `secondaryResidences === 200`, `badHousing === 1220`.
  - `it('fait tomber l’addition juste')` → `population + vacancy + secondaryResidences + badHousing === total`.
  - `it('rend un bloc vacants positif quand la vacance augmente')` → avec `longTermVacantAccomodation: 120`, `vacancy === 120`.
  - `it('renvoie total 0 et blocks null si le besoin est négatif ou nul')` → avec `epcisTotals[0].total = -300`, on obtient `{ total: 0, annualAverage: 0, blocks: null }`. Même chose avec `0`.
  - `it('met badHousing à 0 quand le stock est nul')` → avec `total === totalFlux`, `badHousing === 0`.
- [ ] **Étape 2 :** `pnpm --filter api test -- amf-result` → ÉCHEC.
- [ ] **Étape 3 :** implémenter `buildAmfResult`.
- [ ] **Étape 4 :** `pnpm --filter api test -- amf-result` → SUCCÈS.
- [ ] **Étape 5 :** `git commit -m "feat(api): calculer les blocs de résultat du questionnaire AMF"`

---

### Tâche 3 : tables des leads et lecture de l'EPCI

**Fichiers :**
- Modifier : `apps/api/prisma/schema.prisma`
- Créer : `apps/api/prisma/migrations/20261109120000_add_amf_leads/migration.sql`, généré par `prisma migrate dev --name add_amf_leads` puis renommé avec cet horodatage si besoin.
- Créer : `apps/api/src/amf/amf.service.ts`
- Modifier : `apps/api/src/amf/amf.schemas.ts` (ajouter `ZAmfEpci`)
- Test : `apps/api/src/amf/amf.service.spec.ts`

**Modèles Prisma :**
```prisma
model AmfLead {
  id           String             @id @default(uuid())
  email        String
  epciCode     String             @map("epci_code")
  simulationId String             @unique @map("simulation_id")
  answers      Json
  createdAt    DateTime           @default(now()) @map("created_at")
  simulation   Simulation         @relation(fields: [simulationId], references: [id], onDelete: Cascade)
  contacts     AmfSharedContact[]
  @@map("amf_leads")
}

model AmfSharedContact {
  id        String   @id @default(uuid())
  leadId    String   @map("lead_id")
  role      String
  email     String
  createdAt DateTime @default(now()) @map("created_at")
  lead      AmfLead  @relation(fields: [leadId], references: [id], onDelete: Cascade)
  @@index([leadId])
  @@map("amf_shared_contacts")
}
```
Ajouter la relation inverse `amfLead AmfLead?` sur `Simulation`.

**Interfaces :**
- Produit :
  ```ts
  export const ZAmfEpci = z.object({
    code: z.string(), name: z.string(), fragileProjection: z.boolean(),
    baseYear: z.number(), horizon: z.number(),
    populationChanges: z.object({ haute: z.number(), central: z.number(), basse: z.number().nullable() }),
  })
  class AmfService { getEpci(epciCode: string): Promise<TAmfEpci> }   // NotFoundException si l'EPCI est inconnu
  ```
  Dépendances : `PrismaService`, `DataPackVersionsService`, `DemographicEvolutionService.getDemographicEvolutionPopulationByEpci(code, millesime, [baseYear, 2036])`. Chaque `populationChanges.x` vaut `r10(valeur2036 − valeurBase)`, ou `null` si l'une des deux valeurs est nulle. Si `haute` ou `central` sont nulles, l'EPCI est traité comme introuvable (404).

- [ ] **Étape 1 :** modifier le schéma Prisma, puis `pnpm --filter api exec prisma migrate dev --name add_amf_leads` → migration créée, client régénéré.
- [ ] **Étape 2 : écrire les tests qui échouent** (`describe('AmfService.getEpci')`, mocks `createMock`) :
  - `it('renvoie les évolutions en habitants arrondies entre base et 2036')` → valeurs base `{ central: 448444, haute: 448444, basse: 448444 }` et 2036 `{ central: 457117, haute: 473584, basse: 441290 }` ; on attend `populationChanges = { haute: 25140, central: 8670, basse: -7150 }`, `baseYear: 2022`, `horizon: 2036`.
  - `it('renvoie basse null quand la projection basse manque')`.
  - `it('signale une projection fragile')` → `epci.noInseeProjection = true` donne `fragileProjection: true`.
  - `it('lève NotFoundException pour un EPCI inconnu')`.
- [ ] **Étape 3 :** `pnpm --filter api test -- amf.service` → ÉCHEC.
- [ ] **Étape 4 :** implémenter `getEpci`.
- [ ] **Étape 5 :** `pnpm --filter api test -- amf.service` → SUCCÈS.
- [ ] **Étape 6 :** `git commit -m "feat(api): tables des leads AMF et lecture des projections de l’EPCI"`

---

### Tâche 4 : création de la simulation et enregistrement des contacts

**Fichiers :**
- Modifier : `apps/api/src/amf/amf.service.ts`
- Modifier : `apps/api/src/amf/amf.schemas.ts` (ajouter `ZAmfShareContactsBody`, `ZAmfCreateSimulationResponse`)
- Modifier : `apps/api/src/external/external.module.ts` (ajouter `exports: [ExternalService]`)
- Test : `apps/api/src/amf/amf.service.spec.ts`

**Interfaces :**
- Consomme : `buildAmfSimulationBody` (Tâche 1), `buildAmfResult` (Tâche 2), `getEpci` (Tâche 3), `ExternalService.createSimulation(consumerId, body)`, `AccommodationRatesService.getAccommodationRates(code, millesime)`.
- Produit :
  ```ts
  export const ZAmfShareContactsBody = z.object({
    contacts: z.array(z.object({ role: z.string().trim().min(1).max(100), email: z.email() })).min(1).max(10),
  })
  export const ZAmfCreateSimulationResponse = z.object({ leadId: z.uuid(), result: ZAmfResult })
  createSimulation(consumerId: string, body: TAmfCreateSimulationBody): Promise<TAmfCreateSimulationResponse>
  addContacts(leadId: string, body: TAmfShareContactsBody): Promise<void>   // NotFoundException si le lead est inconnu
  ```
  `createSimulation` enchaîne : `getEpci` (404 si l'EPCI est inconnu ; `BadRequestException` si `demography === 'moins'` et `basse === null`), les taux observés, `buildAmfSimulationBody`, `externalService.createSimulation`, la création d'`amfLead` (`answers` = les réponses sans l'e-mail), puis `buildAmfResult(results, epciCode, baseYear)`.

- [ ] **Étape 1 : écrire les tests qui échouent :**
  - `it('crée la simulation via ExternalService avec le consumer et les taux observés')` → `externalService.createSimulation` est appelé avec `('consumer-1', expect.objectContaining({ scenario: expect.objectContaining({ projection: 2036, b2_scenario: 'PH_C' }) }))`.
  - `it('enregistre le lead lié à la simulation, sans e-mail dans answers')` → `prisma.amfLead.create` est appelé avec `data.email`, `data.simulationId === 'sim-1'`, et `data.answers` sans clé `email`.
  - `it('renvoie leadId et le résultat calculé')`.
  - `it('refuse moins d’habitants sans projection basse')` → `BadRequestException`, et `createSimulation` n'est pas appelé.
  - `it('calcule même quand les taux observés sont à 0')` → avec des taux tous à 0, la méthode se résout sans lever d'erreur.
  - `it('enregistre les contacts partagés')` → `prisma.amfSharedContact.createMany` reçoit `data` avec `leadId`.
  - `it('lève NotFoundException pour un lead inconnu')`.
- [ ] **Étape 2 :** `pnpm --filter api test -- amf.service` → ÉCHEC.
- [ ] **Étape 3 :** implémenter les deux méthodes.
- [ ] **Étape 4 :** `pnpm --filter api test -- amf.service` → SUCCÈS.
- [ ] **Étape 5 :** `git commit -m "feat(api): créer la simulation AMF et enregistrer leads et contacts"`

---

### Tâche 5 : contrôleur, module et contrats

**Fichiers :**
- Créer : `apps/api/src/amf/amf.controller.ts`, `apps/api/src/amf/amf.module.ts`
- Modifier : `apps/api/src/main.module.ts` (importer `AmfModule`)
- Modifier : `apps/api/src/input-contract.spec.ts` (exemples manuels si le générateur ne satisfait pas `epciCode` / `email`), avec les snapshots associés
- Test : `apps/api/src/amf/amf.controller.spec.ts`

**Interfaces :**
- Routes. La classe porte `@Controller('amf')`, `@AllowAnonymous()`, `@UseGuards(ApiKeyGuard)` et `@Throttle({ default: { ttl: 60_000, limit: 20 } })` :
  - `GET amf/epcis/:epciCode` → `TAmfEpci`
  - `POST amf/simulations` (`@Body({ schema: ZAmfCreateSimulationBody })`, `@Consumer()`) → 201 `TAmfCreateSimulationResponse`
  - `POST amf/leads/:leadId/contacts` (`@Body({ schema: ZAmfShareContactsBody })`) → 204
- Le paramètre de route ne doit **pas** s'appeler `simulationId` : `CalculationContext` le lirait.
- `AmfModule` importe `PrismaModule`, `ConsumersModule`, `ExternalModule`, `AccommodationRatesModule`, `DemographicEvolutionModule` et `DataPackVersionsModule`.
- Tags Swagger : `@ApiTags('Questionnaire AMF')`, avec un `@ApiResponse` par statut, comme `external.controller.ts`.

- [ ] **Étape 1 : écrire le test du contrôleur** (délégation au service, `consumer.id` transmis), d'après `external.controller.spec.ts`.
- [ ] **Étape 2 :** implémenter le contrôleur et le module, et enregistrer `AmfModule`.
- [ ] **Étape 3 :** `pnpm --filter api test -- amf route-access input-contract -u` puis relire le diff des snapshots : seules de nouvelles entrées `AmfController.*` doivent apparaître, aucune entrée existante ne doit changer. Ensuite, `pnpm --filter api test` → tout passe.
- [ ] **Étape 4 :** `pnpm --filter api lint` et `pnpm --filter api exec tsc --noEmit` → aucune erreur.
- [ ] **Étape 5 :** `git commit -m "feat(api): exposer les routes du questionnaire AMF derrière clé d’API"`

---

### Tâche 6 : page web `/amf`

**Fichiers :**
- Créer : `apps/web/src/lib/amf/amf-fetch.ts` (`import 'server-only'`)
- Créer : `apps/web/src/app/api/amf/epcis/[code]/route.ts`, `apps/web/src/app/api/amf/simulations/route.ts`, `apps/web/src/app/api/amf/leads/[leadId]/contacts/route.ts`
- Créer : `apps/web/src/app/(unauthenticated)/amf/page.tsx` (métadonnées : titre « Votre besoin en logements en 3 minutes »)
- Créer : `apps/web/src/components/amf/amf-questionnaire.tsx` (état et navigation), `amf-steps.tsx` (un composant par question), `amf-results.tsx`, `amf-share-form.tsx`, `amf-types.ts` (types miroirs de `TAmfEpci`, `TAmfResult` et des réponses)
- Modifier : `apps/web/src/app/(unauthenticated)/layout.tsx`. Ajouter `/amf` à la branche pleine largeur, sans fil d'Ariane.
- Modifier : la documentation des variables d'environnement web (`apps/web/.env.dist`), avec `AMF_API_KEY=`.

**Interfaces :**
- `amfFetch(path: string, init?: RequestInit): Promise<Response>` : `unauthFetch` avec `Authorization: Bearer ${process.env.AMF_API_KEY}`. Une erreur explicite est levée si la variable est absente.
- Les route handlers relaient le statut et le corps de l'API tels quels, sur le modèle de `apps/web/src/app/api/contact/route.ts`.
- Étapes, dans cet ordre : `intro → epci → demography → vacancy → badHousing → secondaryResidences → email → results`. Un bouton « Retour » est disponible jusqu'à l'e-mail, avec une barre de progression (DSFR `Stepper`). Après `results`, il n'y a plus de retour : seulement « Refaire une simulation », qui remet l'état à zéro et revient à `intro`.

Règles d'écran (textes exacts de la spec) :
- **EPCI.**
  - On réutilise `AutocompleteInput`. Pour une commune, on prend `codeEpci` ; une commune sans `codeEpci` est ignorée.
  - On appelle `GET /api/amf/epcis/:code`. Une réponse 404 affiche « Ce territoire n'est pas encore couvert par ce questionnaire, retrouvez-le sur Otelo. »
  - Si `fragileProjection` vaut `true`, un `Alert` de niveau info affiche « Les projections démographiques de ce territoire sont fragiles : les chiffres sont à interpréter avec prudence. »
- **Démographie.**
  - Trois `RadioButtons` : « Plus d'habitants (+X) », « Dans la tendance actuelle (±X) », « Moins d'habitants (−X) ».
  - Chaque X est l'évolution en habitants, formatée en `fr-FR` avec son signe.
  - L'option « moins » est masquée si `basse === null`.
- **E-mail.**
  - Le champ est obligatoire, avec le texte d'aide de la spec et un lien vers `/donnees-personnelles`.
  - Le bouton « Voir mes résultats » est désactivé pendant la requête.
- **Résultats.**
  - Grand chiffre : `total` formaté, suivi de « logements à construire d'ici 2036 », puis « soit environ {annualAverage} par an ».
  - Les blocs sont empilés, avec dans l'ordre « = Évolution de la population », « Logements vacants », « Résidences secondaires » et « Résorption du mal-logement ». Le signe affiché (+/−) suit le signe de la valeur, et la valeur est affichée en absolu.
  - Si `blocks === null`, on affiche le message « besoin nul » de la spec à la place des blocs.
  - La mention de précision de la spec suit, puis le formulaire de partage, puis le bouton « Découvrir Otelo » (`href="/"`).
- **Partage.**
  - Liste de couples (fonction, e-mail) avec un bouton « Ajouter un contact » (10 au maximum) et un bouton « Enregistrer ».
  - Après un 204, le formulaire est remplacé par le message « Merci, nous transmettrons ces résultats. »
- **Mobile first.**
  - Une colonne sous `md`, avec des boutons pleine largeur sur mobile.
  - On vérifie à 375 px de large.

- [ ] **Étape 1 :** implémenter `amfFetch` et les trois route handlers.
- [ ] **Étape 2 :** implémenter la page, les composants et la modification du layout.
- [ ] **Étape 3 :** `pnpm --filter web lint` et `pnpm --filter web exec tsc --noEmit` → aucune erreur.
- [ ] **Étape 4 : vérification manuelle.** Lancer l'API et le web en local, avec une clé `ApiConsumer` créée pour l'occasion et `AMF_API_KEY` renseignée. Ouvrir `/amf` à 375 px, puis vérifier :
  - un parcours complet sur un EPCI classique (`200040715`) ;
  - un EPCI de Dordogne marqué `noInseeProjection`, où l'alerte apparaît et l'option « moins » est absente ;
  - le choix d'une commune dans l'autocomplétion ;
  - le cas « moins d'habitants » + « vacants prioritaires » sur un EPCI en décroissance, jusqu'à obtenir le message de besoin nul si possible ;
  - un double tap sur « Voir mes résultats », qui ne doit produire qu'une seule ligne dans `amf_leads` ;
  - l'enregistrement de deux contacts, qui doivent apparaître dans `amf_shared_contacts` ;
  - l'onglet Réseau du navigateur, qui ne doit contenir aucune trace de la clé.
- [ ] **Étape 5 :** `git commit -m "feat(web): page publique du questionnaire congrès AMF"`
