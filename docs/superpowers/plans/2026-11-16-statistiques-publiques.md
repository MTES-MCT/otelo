# Page publique « Statistiques » dynamique — plan d'implémentation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remplacer la page `/statistiques` statique par une page publique alimentée par un endpoint anonyme agrégé, avec une carte de France zoomable des EPCI utilisateurs.

**Architecture:** Un `PublicStatisticsService` NestJS réutilise les fragments SQL de l'admin (exclusion équipe, scénarios exportés, population RP, réductions visées) et expose `GET /statistics/public` en `@AllowAnonymous()`. Le front Next 16 lit cet endpoint côté serveur (cache de données d'une heure, repli si l'API échoue), et rend la carte via un composant Leaflet extrait de la carte admin.

**Tech Stack:** NestJS + Prisma (`$queryRaw`), Zod (`packages/shared`), Jest (intégration sur Postgres `otelo-test`), Next 16 / React 19, DSFR (`@codegouvfr/react-dsfr`), react-leaflet + fond IGN, recharts.

**Spec:** `docs/superpowers/specs/2026-11-16-statistiques-publiques-design.md`

## Global Constraints

- Aucune donnée au niveau utilisateur ni chiffre de besoins (flux, stock, besoins, nombre de scénarios par EPCI) dans la réponse publique ; par EPCI : `code`, `name`, `department`, `region`, `status` uniquement.
- Comptes équipe exclus partout via `ownerIsNotTeam` / `OWNER_IS_NOT_TEAM` (`apps/api/src/statistics/team.ts`).
- Scénario exporté puis supprimé : compté (définition de `simulationsExportedIn`). Statut `SIMULATED` : simulations `deleted IS NULL` uniquement.
- Lien EPCI ↔ simulation par `epci_scenarios` (comme la page Impact).
- Schémas Zod utilisés directement (`ZPublicStatistics` / `TPublicStatistics`), pas d'alias DTO.
- Route publique hors OpenAPI externe (`@ExcludeOpenApi()`), pour que `openapi.integration-spec.ts` ne bouge pas.
- Commits : une ligne, sans trailer ni mention de Claude. Aucun marqueur « provisoire / à valider » dans le code.
- Toujours `prisma generate` avant toute migration ; aucune migration n'est prévue ici.

## Review Focus

- **API injoignable ou en erreur** : `/statistiques` et l'accueil s'affichent avec l'encart « Statistiques momentanément indisponibles » et le chiffre d'enquête, sans erreur 500 — testé par la fonction pure `toPublicStatisticsOrNull` (Task 6) et vérifié manuellement en coupant l'API.
- **Base sans usage** (aucune simulation) : tous les compteurs à 0, `coveredPopulationShare` à 0 et non `NaN`/`null`, `targetReductions` avec `median: null` — test `base vide` (Task 3).
- **Un EPCI présent dans une simulation supprimée et dans un export** : statut `EXPORTED` ; présent seulement dans une simulation supprimée : absent — tests Task 3.
- **Usage uniquement par l'équipe** : EPCI absent, compteurs à 0 — test Task 3.
- **EPCI utilisateur absent du GeoJSON** (millésime) ou en outre-mer : toujours listé dans le tableau accessible ; boutons de raccourci outre-mer — vérification manuelle Task 6.

---

### Task 1: Schéma partagé `ZPublicStatistics`

**Files:**
- Create: `packages/shared/src/schemas/statistics/public-statistics.ts`
- Modify: `packages/shared/src/schemas/index.ts` (ajouter `export * from './statistics/public-statistics'`)

**Interfaces:**
- Consumes: `ZTargetReduction` depuis `./impact-statistics`
- Produces:
  - `PUBLIC_EPCI_STATUSES = ['SIMULATED', 'EXPORTED'] as const`, `TPublicEpciStatus`
  - `PUBLIC_PLANNING_DOCUMENT_TYPES = ['PLH_PLUI', 'SCOT', 'AUTRES'] as const`
  - `ZPublicStatistics` / `TPublicStatistics` :
    ```ts
    {
      generatedAt: string // ISO
      keyFigures: {
        epcisWithSimulation: number
        epcisWithExport: number
        coveredPopulation: number
        coveredPopulationShare: number // 0–100, une décimale
        planningDocuments: number
        engagedDepartments: number
        totalDepartments: number
      }
      targetReductions: TTargetReduction[]
      planningDocumentsByType: { key: 'PLH_PLUI' | 'SCOT' | 'AUTRES'; count: number }[]
      monthly: { month: string /* YYYY-MM */; simulations: number; exports: number; activeEpcis: number }[]
      epcis: { code: string; name: string; department: string | null; region: string; status: TPublicEpciStatus }[]
    }
    ```
  - Tous les objets en `z.strictObject` : un champ en trop fait échouer le `parse` (garde-fou de l'anti-objectif « rien de plus »).

- [ ] **Step 1:** Écrire le fichier selon l'interface ci-dessus.
- [ ] **Step 2:** `cd packages/shared && pnpm typecheck && pnpm lint` → aucune erreur.
- [ ] **Step 3:** Commit — `git commit -m "feat(shared): schéma des statistiques publiques"`

---

### Task 2: Extraire les fragments SQL réutilisables de l'Impact

Refactor sans changement de comportement de l'admin.

**Files:**
- Create: `apps/api/src/statistics/statistics-sql.ts`
- Modify: `apps/api/src/statistics/impact-statistics.service.ts`

**Interfaces:**
- Produces (dans `statistics-sql.ts`) :
  - `simulationsExportedIn(range: DateRange): Prisma.Sql` — déplacé tel quel.
  - `LATEST_POPULATION: Prisma.Sql` — le `SELECT DISTINCT ON (epci_code) epci_code, population FROM rp ORDER BY epci_code, millesime DESC, year DESC` aujourd'hui inline dans `getImpact`.
  - `ALL_TIME: DateRange` — `{ from: new Date(0), toExclusive: <date lointaine fixe, ex. 9999-01-01> }`.
- Produces (dans `ImpactStatisticsService`) : `getTargetReductions(sims: Prisma.Sql): Promise<TTargetReduction[]>` passe de `private` à public.

- [ ] **Step 1:** Lancer les filets avant : `cd apps/api && pnpm test -- statistics --ci` → noter le résultat (vert).
- [ ] **Step 2:** Déplacer les fragments, importer depuis `statistics-sql.ts`, rendre `getTargetReductions` public.
- [ ] **Step 3:** `pnpm test -- statistics --ci && pnpm lint` → identique à Step 1, aucun snapshot mis à jour.
- [ ] **Step 4:** Commit — `git commit -m "refactor(api): partager les fragments SQL des statistiques d'impact"`

---

### Task 3: `PublicStatisticsService`

**Files:**
- Create: `apps/api/src/statistics/public-statistics.service.ts`
- Create: `apps/api/src/statistics/public-statistics.service.integration-spec.ts`
- Modify: `apps/api/test/fixtures.ts`

**Interfaces:**
- Consumes: Task 1 (`TPublicStatistics`, `ZPublicStatistics`), Task 2 (`simulationsExportedIn`, `LATEST_POPULATION`, `ALL_TIME`, `ImpactStatisticsService.getTargetReductions`), `ownerIsNotTeam`.
- Produces: `PublicStatisticsService.getPublicStatistics(now?: Date): Promise<TPublicStatistics>` — le résultat passe par `ZPublicStatistics.parse` avant retour.
- Fixtures ajoutées dans `test/fixtures.ts` :
  - `createUser(prisma, { role?, type?: UserType })` (étendre l'existant)
  - `createSimulation(..., { epciCodes })` crée aussi les lignes `epci_scenarios` (`EPCIScenario`) pour chaque code
  - `createExport(prisma, { simulationId, createdAt?: Date })` — type `POWERPOINT`
  - `softDeleteSimulation(prisma, id)` — pose `deleted = now()`
  - `seedReferenceData` : poser `departmentName` / `regionName` sur `GRAND_CHALON` et `AUTUNOIS` (Saône-et-Loire / Bourgogne-Franche-Comté) et insérer une ligne `rp` par EPCI (populations 110 000 et 35 000)
  - `resetDatabase` : vider aussi `epci_scenarios` et `rp` avant `epci`

Définitions (copiées de la spec, à implémenter en SQL) :
- `epcisWithSimulation` : EPCI distincts de `epci_scenarios` d'une simulation `deleted IS NULL`, propriétaire hors équipe.
- `epcisWithExport` : EPCI distincts de `simulationsExportedIn(ALL_TIME)`.
- `coveredPopulation` : somme de `LATEST_POPULATION` sur ces EPCI ; `coveredPopulationShare` = `100 * covered / total` arrondi à 1 décimale, `0` si total nul.
- `planningDocuments` : `epci_groups` distincts avec `planning_document_type IS NOT NULL`, ayant au moins une simulation dans `simulationsExportedIn(ALL_TIME)`. `planningDocumentsByType` : même ensemble groupé par type, les trois clés toujours présentes (0 si absent).
- `engagedDepartments` : `department_name` distincts non nuls des EPCI de simulations `deleted IS NULL` dont le propriétaire a `type = 'DDT'`. `totalDepartments` : `department_name` distincts non nuls de `epcis`.
- `targetReductions` : `getTargetReductions(simulationsExportedIn(ALL_TIME))`.
- `monthly` : les 24 mois se terminant au mois de `now`, tous présents même à 0 ; `simulations` = simulations créées dans le mois (hors équipe, `deleted IS NULL`), `exports` = demandes PowerPoint distinctes `(user_id, created_at)` du mois, `activeEpcis` = EPCI distincts des simulations créées dans le mois.
- `epcis` : union des deux ensembles, `EXPORTED` prioritaire, triés par `region`, `department`, `name`.

- [ ] **Step 1: Écrire les tests d'intégration** (modèle : `export-powerpoint/powerpoint-requests.service.integration-spec.ts`, module avec `PrismaModule`, `ImpactStatisticsService`, `PublicStatisticsService`) :

```ts
it('base vide : tout à zéro', async () => {
  const s = await service.getPublicStatistics(new Date('2026-11-16'))
  expect(s.keyFigures).toEqual({ epcisWithSimulation: 0, epcisWithExport: 0, coveredPopulation: 0,
    coveredPopulationShare: 0, planningDocuments: 0, engagedDepartments: 0, totalDepartments: 1 })
  expect(s.epcis).toEqual([])
  expect(s.monthly).toHaveLength(24)
  expect(s.monthly.at(-1)).toEqual({ month: '2026-11', simulations: 0, exports: 0, activeEpcis: 0 })
})

it('simulation seule : SIMULATED ; exportée : EXPORTED prioritaire', async () => {
  // user USER type DDT ; sim A sur GRAND_CHALON + AUTUNOIS ; sim B sur GRAND_CHALON exportée
  expect(s.epcis).toEqual([
    { code: AUTUNOIS.code, name: AUTUNOIS.name, department: 'Saône-et-Loire', region: 'Bourgogne-Franche-Comté', status: 'SIMULATED' },
    { code: GRAND_CHALON.code, name: GRAND_CHALON.name, department: 'Saône-et-Loire', region: 'Bourgogne-Franche-Comté', status: 'EXPORTED' },
  ])
  expect(s.keyFigures).toMatchObject({ epcisWithSimulation: 2, epcisWithExport: 1,
    coveredPopulation: 110000, coveredPopulationShare: 75.9, engagedDepartments: 1 })
})

it('simulation supprimée non exportée : EPCI absent ; supprimée après export : EXPORTED', ...)
it('usage uniquement par un ADMIN : rien de compté', ...)
it('dossier PLH_PLUI avec export compté, dossier SCOT sans export non compté', async () => {
  expect(s.planningDocumentsByType).toEqual([
    { key: 'PLH_PLUI', count: 1 }, { key: 'SCOT', count: 0 }, { key: 'AUTRES', count: 0 }])
  expect(s.keyFigures.planningDocuments).toBe(1)
})
it('utilisateur non DDT : engagedDepartments à 0', ...)
it('monthly : export de deux scénarios au même horodatage = 1 demande', ...)
it('la réponse ne contient aucune clé hors schéma', async () => {
  expect(() => ZPublicStatistics.parse(s)).not.toThrow()
  expect(JSON.stringify(s)).not.toMatch(/email|userId|totalFlux|nbScenarios/)
})
```

- [ ] **Step 2:** `cd apps/api && pnpm test:integration -- public-statistics` → FAIL (`PublicStatisticsService` introuvable).
- [ ] **Step 3:** Implémenter `getPublicStatistics` (requêtes en `Promise.all`, une par bloc), mettre à jour les fixtures. Vérifier que les tests d'intégration existants passent toujours avec les fixtures modifiées.
- [ ] **Step 4:** `pnpm test:integration --ci` → tout PASS. `pnpm lint` → OK.
- [ ] **Step 5:** Commit — `git commit -m "feat(api): calculer les statistiques publiques"`

---

### Task 4: Route anonyme `GET /statistics/public`

**Files:**
- Create: `apps/api/src/statistics/public-statistics.controller.ts`
- Create: `apps/api/src/statistics/public-statistics.controller.spec.ts`
- Modify: `apps/api/src/statistics/statistics.module.ts`

**Interfaces:**
- Consumes: `PublicStatisticsService.getPublicStatistics()`
- Produces: `GET /api/statistics/public` → `TPublicStatistics`, en-tête `Cache-Control: public, max-age=3600`.

Décorateurs : `@ExcludeOpenApi()`, `@Controller('statistics')`, méthode `@AllowAnonymous()` + `@Get('/public')` + `@Header('Cache-Control', 'public, max-age=3600')`. Enregistrer le contrôleur **avant** `StatisticsController` dans `controllers` (pour que `/public` ne soit pas capté par une route générique), et `PublicStatisticsService` dans `providers`.

- [ ] **Step 1: Test unitaire** (modèle `statistics.controller.spec.ts`, service mocké avec `@golevelup/ts-jest`) :
  - `it('délègue au service et renvoie son résultat')`
  - `it('est déclarée anonyme')` : `Reflect.getMetadata('PUBLIC', PublicStatisticsController.prototype.getPublicStatistics)` vaut `true` (même mock de `@thallesp/nestjs-better-auth` que `route-access.spec.ts`).
- [ ] **Step 2:** `pnpm test -- public-statistics.controller` → FAIL.
- [ ] **Step 3:** Implémenter le contrôleur et l'enregistrer.
- [ ] **Step 4:** `pnpm test --ci` (dont `route-access.spec.ts`, `input-contract.spec.ts`) et `pnpm test:integration -- openapi --ci` → PASS sans mise à jour de snapshot.
- [ ] **Step 5:** API lancée en local : `curl -si localhost:4200/api/statistics/public | head -20` sans cookie → `200` + `Cache-Control: public, max-age=3600` + JSON.
- [ ] **Step 6:** Commit — `git commit -m "feat(api): exposer les statistiques publiques sans authentification"`

---

### Task 5: Composant carte EPCI partagé

**Files:**
- Create: `apps/web/src/components/map/epci-map.tsx`, `apps/web/src/components/map/epci-map.module.css`
- Modify: `apps/web/src/components/admin/pilotage-deployment-map.tsx` (utilise `EpciMap`)

**Interfaces:**
- Produces:
  ```ts
  export type EpciMapProps = {
    geoJsonUrl: string
    styleFor: (code: string) => { fill: string; stroke: string; opacity: number } | null // null = non dessiné en couleur (gris)
    tooltipFor: (code: string, name: string) => ReactNode | null
    fitTo?: GeoJSON.Feature[]               // recadrage (filtre admin)
    shortcuts?: { label: string; bounds: [[number, number], [number, number]] }[]
    height?: string
  }
  export function EpciMap(props: EpciMapProps): JSX.Element
  export const FRANCE_BBOX, FRANCE_CENTER, FRANCE_ZOOM
  ```
  Contient : `MapContainer` (zoom +/−, molette, déplacement), `IgnBasemapLayer`, chargement du GeoJSON, bouton « Recentrer sur la France » (`ResetViewButton` existant), boutons de `shortcuts`, tooltips. Pas de `maxBounds` bloquant.
- `pilotage-deployment-map.tsx` garde son API publique (`PilotageDeploymentMapProps`, `MapColorMode`) et son rendu ; seule la mécanique carte passe par `EpciMap`.

- [ ] **Step 1:** Extraire, brancher la carte admin.
- [ ] **Step 2:** `cd apps/web && npx tsc --noEmit && pnpm lint` → OK.
- [ ] **Step 3:** Vérif manuelle (skill `run`) : `/admin` onglet Pilotage, la carte affiche les mêmes couleurs, tooltips, filtres et recadrage qu'avant.
- [ ] **Step 4:** Commit — `git commit -m "refactor(web): extraire la carte des EPCI en composant partagé"`

---

### Task 6: Page `/statistiques` dynamique

**Files:**
- Create: `apps/web/src/server-only/statistics/get-public-statistics.ts`
- Create: `apps/web/src/app/(unauthenticated)/statistiques/_components/` : `key-figures.tsx`, `public-epci-map.tsx` (+ wrapper `next/dynamic` `ssr: false`), `epci-list.tsx`, `monthly-chart.tsx`, `planning-documents-chart.tsx`, `target-reductions.tsx`, `methodology.tsx`
- Create: `apps/web/src/constants/survey-statistics.ts`
- Modify: `apps/web/src/app/(unauthenticated)/statistiques/page.tsx`, `statistiques.module.css`

**Interfaces:**
- Produces:
  - `toPublicStatisticsOrNull(payload: unknown): TPublicStatistics | null` — `ZPublicStatistics.safeParse`, `null` si invalide.
  - `getPublicStatistics(): Promise<TPublicStatistics | null>` — `fetch(\`${process.env.NEXT_PUBLIC_AUTH_API_URL}/api/statistics/public\`, { next: { revalidate: 3600, tags: ['public-statistics'] } })` ; `null` sur erreur réseau, statut non OK ou payload invalide (jamais de throw). Une heure plutôt que 24 h : borne le temps d'affichage d'un repli si une réponse d'échec était mise en cache.
  - `SURVEY_INFLUENCED_DOCUMENTS = { value: 15, since: '2025-01-01', source: "Compteur de l'équipe d'après enquête quantitative auprès des utilisateurs formés" }`
- Page : `export const dynamic = 'force-dynamic'` (rendu à la requête, données en cache 1 h ; rien n'est figé au `next build`).

Contenu, dans l'ordre (voir le schéma de la spec) :
1. H1 « Statistiques », « Mis à jour le JJ/MM/AAAA » (`generatedAt`).
2. Phrase phare : réduction médiane de vacance longue visée (`targetReductions` domaine `longTermVacancy`, `median`) et nombre de scénarios ; masquée si `median` est `null`.
3. `KeyFigures` : EPCI utilisateurs (`epcisWithExport` + mention des `epcisWithSimulation`), population couverte (valeur + %), documents d'urbanisme (`planningDocuments`) à côté de `SURVEY_INFLUENCED_DOCUMENTS` avec libellés distincts, DDT engagées (`engagedDepartments / totalDepartments`).
4. Carte : `EpciMap` avec `/geojson/epci-1000m.geojson` ; `EXPORTED` `#000091`, `SIMULATED` `#7373FF`, sinon gris ; tooltip nom, département, statut en clair ; légende textuelle ; `shortcuts` Guadeloupe, Martinique, Guyane, La Réunion, Mayotte.
5. `EpciList` : lien « Voir la liste des EPCI utilisateurs » ouvrant un tableau DSFR (région, département, EPCI, statut), source `epcis` de l'API (pas le GeoJSON).
6. `MonthlyChart` et `PlanningDocumentsChart` (recharts, barres), chacun suivi d'une transcription textuelle (`<details>` ou tableau) ; libellés de types : `PLH_PLUI` « PLH / PLUi-H », `SCOT` « SCoT », `AUTRES` « Autres documents ».
7. `TargetReductions` : les domaines avec `median` non nul, libellés `TARGET_REDUCTION_LABELS`.
8. `Methodology` : accordéon DSFR, une entrée par indicateur reprenant les définitions de Task 3 (dont : export supprimé compté, comptes équipe exclus, DDT inscrite sans simulation non comptée, chiffre d'enquête déclaratif).
9. CTA « Demander un accès » → `/contact`.
- Si `getPublicStatistics()` renvoie `null` : `Alert` DSFR « Statistiques momentanément indisponibles », chiffre d'enquête et CTA seuls.

- [ ] **Step 1:** Implémenter `toPublicStatisticsOrNull` et `getPublicStatistics`.
- [ ] **Step 2:** Implémenter les composants et la page.
- [ ] **Step 3:** `npx tsc --noEmit && pnpm lint` → OK.
- [ ] **Step 4:** Vérif manuelle (skill `run`), navigation privée (non connecté) :
  - `/statistiques` affiche chiffres, carte zoomable/dézoomable/déplaçable, tooltips, raccourcis outre-mer, liste, graphiques et transcriptions ;
  - un EPCI de la liste absent du GeoJSON reste listé ;
  - API arrêtée → encart d'indisponibilité, pas de 500.
- [ ] **Step 5:** Commit — `git commit -m "feat(web): page publique de statistiques alimentée par l'API"`

---

### Task 7: Accueil branché sur les mêmes données

**Files:**
- Modify: `apps/web/src/app/(unauthenticated)/accueil/_components/section-statistics/section-statistics.tsx`, `apps/web/src/app/(unauthenticated)/accueil/page.tsx`
- Delete: `apps/web/src/assets/img/acces_collectivite.png`, `acces_ddt.png` (après `grep` confirmant qu'ils ne servent plus ailleurs)

**Interfaces:**
- Consumes: `getPublicStatistics()`, `SURVEY_INFLUENCED_DOCUMENTS` (Task 6).

`SectionStatistics` devient un server component asynchrone : chiffre d'enquête (inchangé, avec sa mention de source) + « EPCI utilisateurs » (`epcisWithExport`) ; si les données sont `null`, seul le chiffre d'enquête s'affiche. `page.tsx` de l'accueil passe en `dynamic = 'force-dynamic'` si nécessaire.

- [ ] **Step 1:** Implémenter, supprimer les PNG inutilisés.
- [ ] **Step 2:** `npx tsc --noEmit && pnpm lint && pnpm build` → OK.
- [ ] **Step 3:** Vérif manuelle : `/accueil` affiche les deux chiffres, lien vers `/statistiques` ; API arrêtée → chiffre d'enquête seul.
- [ ] **Step 4:** Commit — `git commit -m "feat(web): chiffres de l'accueil issus des statistiques publiques"`
