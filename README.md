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
