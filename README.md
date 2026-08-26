# OTELO

L'application d'intelligence territoriale pour une stratégie de logement adaptée, durable et inclusive


## CLI

Le projet dispose d'une interface en ligne de commande intégrée dans l'application API.

```bash
# Depuis la racine du monorepo
pnpm -F api cli <commande>

# Ou depuis le dossier apps/api
cd apps/api && pnpm cli <commande>
```

### Commande `import-backup`

Restaure une sauvegarde de la base de données de production depuis Scalingo.

```bash
pnpm --filter @otelo/api cli import-backup
```

**Fonctionnalités :**

- Authentification automatique via l'API Scalingo avec échange de tokens
- Récupération de la dernière sauvegarde complète disponible
- Téléchargement et extraction des archives `.tar.gz`
- Suppression sécurisée des tables et enums existants
- Restauration via `pg_restore` avec gestion des erreurs non-critiques
- Nettoyage automatique des fichiers temporaires

**Variables d'environnement requises :**

| Variable | Description |
|----------|-------------|
| `SCALINGO_API_TOKEN` | Token d'authentification Scalingo |
| `SCALINGO_APP_NAME` | Nom de l'application sur Scalingo |
| `SCALINGO_ADDON_ID` | ID de l'addon PostgreSQL |
| `SCALINGO_DB_API_URL` | URL de l'API base de données |
| `SCALINGO_REGION` | Région Scalingo (ex: `osc-fr1`) |
| `DATABASE_URL` | URL de connexion PostgreSQL locale |

### Commande `recalculate-results`

Recalcule et enrichit les résultats de simulation en base (métriques stock B11-B15, flux, sitadel, données par année).

**Par défaut, la commande fonctionne en dry-run** (aucune écriture en base). Il faut passer `--write` pour persister.

```bash
# Dry-run sur toutes les simulations (défaut, aucune écriture)
pnpm -F api cli recalculate-results

# Écriture en base pour toutes les simulations
pnpm -F api cli recalculate-results --write

# Dry-run sur une seule simulation
pnpm -F api cli recalculate-results --simulation-id <uuid>

# Écriture en base pour une seule simulation
pnpm -F api cli recalculate-results --simulation-id <uuid> --write
```

**Options :**

| Option | Description |
|--------|-------------|
| `--simulation-id <id>` | Recalculer une seule simulation |
| `--write` | Persister les résultats en base (sans ce flag = dry-run) |

**Données calculées et stockées :**

- Totaux agrégés par EPCI (total, flux, stock, pre/post-peak)
- Métriques stock B11-B15 par EPCI (hors logement, hébergés, inadéquation financière, mauvaise qualité, inadéquation physique)
- Totaux flux par EPCI (évolution démographique, renouvellement, résidences secondaires, vacance courte/longue durée)
- Données flux par année par EPCI (évolution du parc, besoins en logements, surplus)
- Données Sitadel par EPCI
- Historique complet du calcul (snapshot JSON dans `simulation_results_history`)

### Commande `import-csv`

Importe un fichier CSV dans une table de données versionnée par millésime. Génère du SQL `INSERT ... ON CONFLICT DO NOTHING` : les doublons sont ignorés, **aucune donnée existante n'est écrasée**.

```bash
# Afficher le SQL dans le terminal (review)
pnpm -F api cli import-csv --table rp --csv ./data/rp.csv --millesime 2024

# Écrire le SQL dans un fichier (pour copier dans pgAdmin/DBeaver)
pnpm -F api cli import-csv --table rp --csv ./data/rp.csv --millesime 2024 --output sql/import-rp.sql

# Exécuter directement en base locale (dev uniquement)
pnpm -F api cli import-csv --table rp --csv ./data/rp.csv --millesime 2024 --execute
```

**Options :**

| Option | Requis | Description |
|--------|--------|-------------|
| `--table <name>` | oui | Nom de la table PostgreSQL (ex: `rp`, `sitadel`, `homeless`) |
| `--csv <path>` | oui | Chemin vers le(s) fichier(s) CSV (répétable : `--csv a.csv --csv b.csv`) |
| `--millesime <value>` | non | Millésime à injecter (ex: `2024`). Crée le `DataPackVersion` si inexistant |
| `--output <path>` | non | Écrire le SQL dans un fichier au lieu du terminal |
| `--execute` | non | Exécuter le SQL directement en base locale |

**Tables autorisées :**

`rp`, `sitadel`, `demographic_evolution_omphale`, `demographic_evolution_population`, `household_sizes`, `vacancy_accommodation`, `filocom_flux`, `bad_quality_filocom`, `bad_quality_rp`, `bad_quality_fonciers`, `physical_inadequation_rp`, `physical_inadequation_filo`, `financial_inadequation`, `hosted_filocom`, `hosted_finess`, `hosted_sne`, `hotel`, `makeshift_housing_rp`, `makeshift_housing_sne`, `homeless`, `social_parc`, `data_pack_versions`

**Format CSV attendu :**

- Séparateur : virgule `,`
- Première ligne : en-têtes (noms de colonnes)
- Encodage : UTF-8
- Les valeurs numériques sont préservées telles quelles (pas d'arrondi)
- Les cellules vides → `NULL`
- La virgule décimale française est convertie en point automatiquement

**Mapping automatique des en-têtes :**

Le script mappe les en-têtes CSV vers les colonnes PostgreSQL via plusieurs stratégies : match exact (`epci_code`), case-insensitive (`Epci_Code`), camelCase→snake_case (`epciCode`), et aliases courants (`epci`→`epci_code`, `annee`→`year`). Le millésime passé via `--millesime` est injecté automatiquement (inutile de l'avoir dans le CSV). Les colonnes `created_at`/`updated_at` sont ignorées.

**Sécurité :**

- `ON CONFLICT DO NOTHING` : aucune donnée existante n'est modifiée
- Le `DataPackVersion` est créé avec `isActive: false` (activation manuelle)
- Whitelist de tables : impossible d'importer dans les tables sensibles (users, sessions, simulations...)
- INSERT groupés par batch de 500 lignes

**Workflow pour un nouveau millésime :**

```bash
# 1. Exporter chaque onglet Excel en CSV
# 2. Générer les fichiers SQL
mkdir -p sql
pnpm -F api cli import-csv --table rp                               --csv ./data/rp.csv           --millesime 2024 --output sql/01-rp.sql
pnpm -F api cli import-csv --table sitadel                          --csv ./data/sitadel.csv      --millesime 2024 --output sql/02-sitadel.sql
pnpm -F api cli import-csv --table demographic_evolution_omphale    --csv ./data/omphale.csv      --millesime 2024 --output sql/03-omphale.sql
pnpm -F api cli import-csv --table demographic_evolution_population --csv ./data/pop.csv          --millesime 2024 --output sql/04-pop.sql
# ... (une commande par onglet Excel)

# 3. Review les fichiers .sql générés
# 4. Tester en local avec --execute
# 5. Copier les .sql dans pgAdmin connecté à la prod
```

**Fusion de plusieurs CSV (données réparties) :**

Certaines tables (ex: `homeless`) reçoivent leurs données dans plusieurs fichiers CSV distincts (un pour `rp`, un pour `sne`). En passant plusieurs `--csv`, le script fusionne les lignes par clé primaire et génère un seul INSERT complet.

```bash
# homeless : 2 CSV avec des colonnes différentes, fusionnés par epci_code
pnpm -F api cli import-csv --table homeless --csv ./data/homeless_rp.csv --csv ./data/homeless_sne.csv --millesime 2024
```

Les lignes sont matchées par la clé primaire de la table. Chaque CSV apporte ses colonnes, les valeurs non-vides ont priorité. Le résultat est un seul INSERT avec toutes les colonnes remplies.

### Commande `import-projections`

Charge les classeurs « Projections détaillées » Omphale — population et ménages, aux niveaux EPCI
et bassin d'habitat — dans les six tables `projection_*`. Commande distincte d'`import-csv`, qui
ne convient pas ici : les fichiers sont en XLSX (71 et 104 Mo), une feuille alimente une table
après dépliage de colonnes, et `ON CONFLICT DO NOTHING` ferait d'un réimport correctif un no-op
silencieux.

```bash
# Dry-run : compte, valide, n'écrit rien
pnpm -F api cli import-projections \
  --epci-file "./Projections_EPCI_indicateurs_final.xlsx" \
  --bh-file   "./Projections_BH_indicateurs_final.xlsx" \
  --millesime 2022

# Écriture en base
pnpm -F api cli import-projections --epci-file ... --bh-file ... --millesime 2022 --write

# Reprise d'une seule feuille après un échec
pnpm -F api cli import-projections --bh-file ... --millesime 2022 --only Menages_typologie --write
```

**Options :**

| Option | Requis | Description |
|--------|--------|-------------|
| `--epci-file <path>` | l'un des deux | Classeur des projections au niveau EPCI |
| `--bh-file <path>` | l'un des deux | Classeur des projections au niveau bassin d'habitat |
| `--millesime <value>` | non | Millésime cible. **Doit exister** dans `data_pack_versions` (défaut : millésime actif) |
| `--only <sheet>` | non | Limiter à une feuille (répétable) |
| `--write` | non | Écrire en base (sans ce flag : dry-run) |
| `--emit-zones-sql <path>` | non | Régénérer le bloc `VALUES` du référentiel de zones |
| `--passage-file <path>` | avec `--emit-zones-sql` | `Table de passage EPCI - BH.xlsx` |

**Prérequis :** les migrations `20260824100000_add_projection_zones` et
`20260824100100_add_projection_indicators` doivent être appliquées. La première peuple
`projection_zones` (561 zones) ; l'import échoue tant que cette table est vide, les mesures ayant
une clé étrangère vers elle.

**Comportement :**

- Lecture en flux (`exceljs`), sans charger les fichiers en mémoire.
- Idempotent : chaque feuille purge les lignes du couple millésime × niveau avant d'insérer. Un
  réimport corrige donc réellement les données, et réimporter le seul classeur bassin ne touche
  pas aux données EPCI.
- Une zone absente de `projection_zones` ou une colonne de mesure non reconnue **font échouer**
  l'import — rien n'est ignoré silencieusement.
- Les deux lignes 2018 des bassins de Dordogne sont fusionnées en une ligne complète (voir
  `projection-row-merger.ts`).
- Le rapport de fin signale les zones non projetées (`ind_robust = 0`) et les colonnes restées
  intégralement vides ou nulles.

**Mise en production :** contrairement aux autres imports, on n'exporte pas de `.sql` à coller
dans pgAdmin — la feuille âge × sexe représenterait environ 1 Go de SQL. La commande est lancée
avec `--write` directement contre le `DATABASE_URL` de production (one-off Scalingo ou depuis un
poste). Le `DELETE` ciblé rend l'opération rejouable sans risque.

**Contrôles après import :** `psql "$DATABASE_URL" -f apps/api/prisma/checks/projections.sql`
(volumétrie attendue, robustesse, cohérence entre feuilles, cas du Grand Paris et de la Dordogne).

**Régénérer le référentiel de zones** — seulement si le découpage des bassins change :

```bash
pnpm -F api cli import-projections \
  --epci-file ./epci.xlsx --bh-file ./bh.xlsx \
  --passage-file "./Table de passage EPCI - BH.xlsx" \
  --emit-zones-sql ./zones.sql
```

Le bloc produit est relu puis collé dans une migration : la table de passage n'est pas versionnée
avec le code et n'existe ni sur la CI ni en production, alors que le déploiement joue
`prisma migrate deploy`.


## Architecture technique

### Structure du monorepo

```
otelo/
├── apps/
│   ├── api/           # Backend NestJS
│   └── web/           # Frontend Next.js
├── packages/
│   └── shared/        # Types, schémas et enums partagés
└── [configurations racine]
```

### Backend (`@otelo/api`)

| Technologie | Version | Usage |
|-------------|---------|-------|
| NestJS | 11.x | Framework backend |
| Prisma | 6.x | ORM PostgreSQL |
| NextAuth/JWT | - | Authentification |
| ExcelJS | 4.x | Export Excel |
| Puppeteer | 24.x | Génération Powerpoint |
| PapaParse | 5.x | Parsing CSV |

**Modules principaux :**

- **Authentification** : ProConnect (OAuth2 gouvernemental), gestion des sessions, impersonation admin
- **Entités métier** : EPCI, groupements, scénarios, simulations
- **Calculs** : coefficients, ratios, besoins flux/stock
- **Exports** : Excel, PowerPoint

### Frontend (`@otelo/web`)

| Technologie | Version | Usage |
|-------------|---------|-------|
| Next.js | 16.x | Framework React |
| React | 19.x | Librairie UI |
| DSFR | - | Design System de l'État |
| React Hook Form + Zod | - | Formulaires et validation |
| TanStack Query | 5.x | État serveur |
| Recharts | 3.x | Visualisation données |
| Leaflet | 1.9.x | Cartographie |

### Mesure d'audience (Matomo)

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_MATOMO_URL` | URL de l'instance Matomo (ex : `https://stats.beta.gouv.fr`). Vide = tracker désactivé. |
| `NEXT_PUBLIC_MATOMO_SITE_ID` | Identifiant du site dans Matomo |

⚠️ Ces variables sont préfixées `NEXT_PUBLIC_` : Next.js les **inline au build**. Elles doivent donc être définies au moment du `pnpm build:web` sur Scalingo, pas seulement au runtime. Un build fait sans elles produit une application sans mesure d'audience, sans erreur visible.

Le tracking n'est actif qu'en `NODE_ENV=production`. Le plan de tracking complet (catalogue d'événements, dimensions personnalisées, limites connues) est maintenu dans [`apps/web/src/lib/TRACKING.md`](apps/web/src/lib/TRACKING.md) — toute instrumentation ajoutée au code doit y être documentée.

### Package partagé (`@shared`)

Types TypeScript et schémas Zod réutilisables entre le frontend et le backend :

- Schémas de validation pour les résultats de calcul
- Définitions des entités (utilisateurs, EPCI, scénarios)
- Enums métier (rôles, types d'utilisateurs, sources de données)

### Scripts de développement

```bash
pnpm dev          # Lancer tous les services en parallèle
pnpm dev:api      # Serveur NestJS uniquement
pnpm dev:web      # Serveur Next.js uniquement
pnpm build        # Compiler tous les packages
pnpm lint         # Vérifier le code avec Biome
pnpm lint:fix     # Corriger automatiquement le style
```

### Prérequis

- Node.js 20+
- pnpm 10.28.2+
- PostgreSQL 15+
