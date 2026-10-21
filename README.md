# OTELO

L'application d'intelligence territoriale pour une stratégie de logement adaptée, durable et inclusive.

OTELO aide les collectivités (EPCI, services de l'État) à estimer leurs **besoins en logements**. Elle prend en compte le mal-logement actuel (besoins en stock) et les évolutions démographiques et du parc (besoins en flux), à partir de données publiques versionnées par millésime.

- Site public : https://otelo.beta.gouv.fr
- Dépôt : https://github.com/MTES-MCT/otelo

## Sommaire

1. [Prérequis](#prérequis)
2. [Démarrage rapide](#démarrage-rapide)
3. [Se connecter en local](#se-connecter-en-local)
4. [Variables d'environnement](#variables-denvironnement)
5. [Architecture technique](#architecture-technique)
6. [Authentification et accès](#authentification-et-accès)
7. [Base de données et données de référence](#base-de-données-et-données-de-référence)
8. [CLI](#cli)
9. [Tests](#tests)
10. [Qualité de code](#qualité-de-code)
11. [Workflow Git](#workflow-git)
12. [CI et déploiement](#ci-et-déploiement)
13. [Services externes](#services-externes)
14. [Glossaire métier](#glossaire-métier)
15. [Documentation complémentaire](#documentation-complémentaire)
16. [Pièges fréquents](#pièges-fréquents)


## Prérequis

| Outil | Version | Remarque |
|-------|---------|----------|
| Node.js | **24** | Imposé par `engines` dans tous les `package.json` (la CI utilise 24.11.1) |
| pnpm | **10.28.2** | Fourni par corepack : `corepack enable` (voir `packageManager`) |
| Docker | - | Pour la base PostgreSQL locale |
| PostgreSQL | **16** | Lancé via Docker ; il faut aussi les clients `psql` et `pg_restore` sur le poste pour `import-backup` |
| Chrome | - | Utilisé par Puppeteer pour générer les graphiques de l'export PowerPoint |

Il faut aussi un accès réseau : au démarrage, l'API télécharge les fichiers Docurba (voir [`sync-docurba`](#autres-commandes)).


## Démarrage rapide

### 1. Installer les dépendances

```bash
corepack enable
pnpm install

# Le package partagé doit être compilé avant l'API et le web
pnpm build:shared

# Générer le client Prisma (dans apps/api/src/generated/prisma, non versionné)
pnpm -F @otelo/api exec prisma generate
```

### 2. Lancer PostgreSQL

```bash
docker compose -f apps/api/docker-compose.yml up -d
```

Postgres 16 écoute sur le **port 5442** de l'hôte. L'utilisateur, le mot de passe et la base s'appellent tous `otelo` :

```
postgresql://otelo:otelo@localhost:5442/otelo
```

### 3. Configurer les variables d'environnement

```bash
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.dist apps/web/.env.local
```

Dans `apps/api/.env` :

- `DATABASE_URL=postgresql://otelo:otelo@localhost:5442/otelo`
- `PORT=4200` : **obligatoire en local**. Par défaut, l'API écoute sur 3000, le même port que Next.js.
- `NODE_ENV=development`
- `CLIENT_BASE_URL=http://localhost:3000` et `BETTER_AUTH_URL=http://localhost:3000` (l'authentification passe par la rewrite Next.js).
- `BETTER_AUTH_SECRET` : une chaîne aléatoire, par exemple `openssl rand -base64 32`.
- Les autres variables obligatoires (Brevo, ProConnect, Démarches Simplifiées…) doivent être présentes, car l'API valide sa configuration au démarrage et refuse de démarrer sinon. En local, des valeurs factices suffisent si vous n'utilisez pas ces services. Demandez les vraies valeurs à l'équipe si besoin.

Dans `apps/web/.env.local` :

```
NEXT_PUBLIC_AUTH_API_URL=http://localhost:4200/api
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_DOCURBA_BASE_URL=https://docurba.beta.gouv.fr
NEXT_PUBLIC_MATOMO_URL=
NEXT_PUBLIC_MATOMO_SITE_ID=
```

Le détail de chaque variable est dans la section [Variables d'environnement](#variables-denvironnement).

### 4. Initialiser la base de données

⚠️ **Les migrations Prisma seules ne suffisent pas à obtenir une base fonctionnelle.** Les données de référence (EPCI, données INSEE, Filocom, etc.) sont chargées hors migrations. Par exemple, la migration `20260824100000_add_projection_zones` insère des zones qui référencent des EPCI.

La méthode habituelle consiste à restaurer la dernière sauvegarde de production depuis Scalingo :

```bash
# Nécessite les variables SCALINGO_* dans apps/api/.env, ainsi que psql et pg_restore
pnpm -F @otelo/api cli import-backup
```

> ⚠️ Cette commande **supprime toutes les tables de la base locale** avant de restaurer. La sauvegarde contient des **données personnelles réelles** (comptes utilisateurs). Elles ne doivent jamais quitter votre poste, et la base locale ne doit pas être partagée.

Appliquez ensuite les migrations éventuellement plus récentes que la sauvegarde :

```bash
pnpm -F @otelo/api prisma migrate deploy
```

### 5. Lancer les applications

Dans deux terminaux :

```bash
pnpm -F @otelo/api dev   # API NestJS → http://localhost:4200/api
pnpm -F @otelo/web dev   # Front Next.js → http://localhost:3000
```

- `dev` côté API lance d'abord `cli sync-docurba`, puis `nest start --watch`.
- `dev` côté web régénère d'abord les icônes DSFR (`predev`).
- Pour travailler sur `packages/shared` en continu : `pnpm -F @shared dev` (tsup en mode watch).

Vérifications :

- Santé de l'API : http://localhost:4200/api/health
- Swagger interne : http://localhost:4200/api/swagger
- Swagger de l'API externe : http://localhost:4200/api/swagger-external

### 6. (Optionnel) Export PowerPoint

Puppeteer n'installe Chrome automatiquement que lors du build Scalingo (`BUILD_TARGET=@otelo/api`). En local :

```bash
cd apps/api && npx puppeteer browsers install chrome
```

Vous pouvez aussi renseigner `PUPPETEER_EXECUTABLE_PATH` avec le chemin d'un Chrome existant.


## Se connecter en local

1. Créez un compte sur http://localhost:3000/inscription.
2. En dehors de la production, **aucun email n'est envoyé** (sauf avec `EMAIL_ENABLED=true`). Leurs paramètres sont journalisés dans les logs de l'API sous la forme `[Brevo:skipped]`. Avec `EMAIL_DEBUG_SECRETS=true` dans `apps/api/.env`, le lien de vérification d'email et le code de double authentification apparaissent en clair dans ces logs. ⚠️ Ce réglage est réservé au local.
3. Pour éviter la double authentification, ajoutez votre email à `TWO_FACTOR_BYPASS_EMAILS`. Le format accepte des adresses séparées par des virgules ou un domaine (`@exemple.fr`).
4. Donnez-vous l'accès à l'application et le rôle administrateur en SQL :

   ```sql
   UPDATE users SET role = 'ADMIN', "hasAccess" = true WHERE email = 'vous@exemple.fr';
   ```

   Si vous avez restauré une sauvegarde, vous pouvez aussi utiliser un compte existant.

La connexion **ProConnect** ne fonctionne qu'avec de vrais identifiants OAuth (`OAUTH_PROCONNECT_*`).


## Variables d'environnement

### API (`apps/api/.env`)

Elles sont validées au démarrage par un schéma Zod (`apps/api/src/config/env.ts`). En cas d'erreur, l'API s'arrête avec `Configuration d'environnement invalide`. Le fichier `.env` n'est chargé qu'en dehors de la production.

| Variable | Requise | Description |
|----------|---------|-------------|
| `NODE_ENV` | non (`development`) | Environnement d'exécution |
| `PORT` | non (`3000`) | Port HTTP de l'API. **Mettre `4200` en local** |
| `CLIENT_BASE_URL` | en prod | URL du front (CORS, origine de confiance better-auth, liens dans les emails). Défaut `http://localhost:3000` |
| `DATABASE_URL` | **oui** | Connexion PostgreSQL |
| `BETTER_AUTH_SECRET` | **oui** | Secret better-auth (sert aussi à chiffrer les secrets 2FA) |
| `BETTER_AUTH_URL` | non | URL publique de l'authentification. En local : `http://localhost:3000` |
| `BREVO_API_KEY`, `BREVO_API_URL` | **oui** | Envoi d'emails transactionnels via Brevo |
| `BREVO_EMAIL_VERIFICATION_TEMPLATE_ID`, `BREVO_PASSWORD_RESET_TEMPLATE_ID`, `BREVO_IMPORT_USER_TEMPLATE_ID`, `BREVO_TWO_FACTOR_TEMPLATE_ID` | **oui** | Identifiants des templates Brevo |
| `EMAIL_SENDER_EMAIL`, `EMAIL_SENDER_NAME` | **oui** | Expéditeur des emails |
| `EMAIL_RECEIVER_EMAIL` | **oui** | Boîte qui reçoit les messages de contact et les retours utilisateurs |
| `EMAIL_ENABLED` | non (`false`) | Hors production, n'envoie réellement les emails que si `true` |
| `EMAIL_DEBUG_SECRETS` | non (`false`) | Affiche en clair les secrets des emails non envoyés (code 2FA, liens). **Local uniquement** |
| `OAUTH_PROCONNECT_CLIENT_ID`, `OAUTH_PROCONNECT_CLIENT_SECRET` | **oui** | Client OIDC ProConnect |
| `OAUTH_PROCONNECT_ISSUER` | **oui** | Hôte ProConnect, sans chemin (le code ajoute `/api/v2`) |
| `DEMARCHES_SIMPLIFIEES_DEMARCHE_ID`, `DEMARCHES_SIMPLIFIEES_TOKEN`, `DEMARCHES_SIMPLIFIEES_URL` | **oui** | API GraphQL Démarches Simplifiées (synchronisation des demandes d'accès) |
| `TRUSTED_PROXY_IPS` | **oui** (peut être vide) | Proxys de confiance pour résoudre l'IP client (rate limiting) |
| `TWO_FACTOR_BYPASS_EMAILS` | non | Emails ou `@domaines` dispensés de 2FA (le mot de passe et le contrôle d'accès restent appliqués) |
| `EPCI_NEIGHBORS_ALLOWED_EMAILS` | non | Emails autorisés à consulter la fonctionnalité « territoires voisins » |
| `EXPORT_DUPLICATE_WINDOW_MINUTES` | non (`30`) | Fenêtre de détection des exports PowerPoint en double |
| `PUPPETEER_EXECUTABLE_PATH` | non | Chemin vers Chrome pour Puppeteer |
| `SCALINGO_API_TOKEN`, `SCALINGO_APP_NAME`, `SCALINGO_ADDON_ID`, `SCALINGO_DB_API_URL`, `SCALINGO_REGION` | non | Uniquement pour la commande `import-backup` |
| `INTEGRATION_DATABASE_URL` | non | Base des tests d'intégration (défaut `postgresql://otelo:otelo@localhost:5442/otelo-test`) |
| `SYNC_DOCURBA_ON_BUILD` | non | Utilisée par le script `postbuild` de l'API |

### Web (`apps/web/.env.local`)

Le front ne valide pas ses variables. ⚠️ Les variables `NEXT_PUBLIC_*` sont **inlinées par Next.js au build**. Elles doivent donc être définies au moment du `pnpm build:web` sur Scalingo, pas seulement au runtime.

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_AUTH_API_URL` | URL de l'API (`/api` est ajouté s'il manque). Sert à la rewrite `/api/auth/*` et aux appels côté serveur. Défaut `http://localhost:4200` |
| `NEXT_PUBLIC_APP_URL` | URL du front, base du client better-auth (ajoutée à la CSP). Défaut `http://localhost:3000` |
| `NEXT_PUBLIC_DOCURBA_BASE_URL` | URL de Docurba pour les liens sortants |
| `NEXT_PUBLIC_MATOMO_URL` | URL de l'instance Matomo (ex. `https://stats.beta.gouv.fr`). Vide = tracker désactivé |
| `NEXT_PUBLIC_MATOMO_SITE_ID` | Identifiant du site dans Matomo |

#### Mesure d'audience (Matomo)

Un build fait sans les variables Matomo produit une application sans mesure d'audience, sans erreur visible. Le tracking n'est actif qu'avec `NODE_ENV=production`, et jamais pendant une impersonation.

Le plan de tracking complet (catalogue d'événements, dimensions personnalisées, limites connues) est maintenu dans [`apps/web/src/lib/TRACKING.md`](apps/web/src/lib/TRACKING.md). Toute instrumentation ajoutée au code doit y être documentée.


## Architecture technique

### Structure du monorepo

```
otelo/
├── apps/
│   ├── api/                 # Backend NestJS (@otelo/api)
│   │   ├── prisma/          # schema.prisma, migrations, checks SQL
│   │   ├── public/          # Template PowerPoint, fichiers Docurba
│   │   ├── test/            # Setup Jest, config des tests d'intégration
│   │   └── docker-compose.yml
│   └── web/                 # Frontend Next.js (@otelo/web)
├── packages/
│   └── shared/              # Types, schémas Zod et enums partagés (@shared)
├── scripts/                 # scalingo-postbuild.mjs
├── .circleci/               # Pipeline CI
├── Aptfile, .buildpacks, Procfile   # Déploiement Scalingo
└── biome.json               # Lint et formatage
```

Le workspace pnpm (`pnpm-workspace.yaml`) centralise les versions partagées dans un `catalog` (Biome, TypeScript, Zod, dayjs, `@types/node`).

### Backend (`@otelo/api`)

| Technologie | Version | Usage |
|-------------|---------|-------|
| NestJS | 11.x | Framework backend |
| Prisma | 6.x | ORM PostgreSQL |
| better-auth (`@thallesp/nestjs-better-auth`) | 1.6.x | Authentification, sessions, 2FA, OAuth, administration |
| Zod | 4.x | Validation des entrées et de la configuration |
| ExcelJS | 4.x | Export Excel, lecture des classeurs XLSX |
| Puppeteer + Chart.js | 25.x | Rendu des graphiques en images pour l'export PowerPoint |
| JSZip | - | Assemblage du PowerPoint à partir de `public/ppt/template.pptx` |
| PapaParse | 5.x | Parsing CSV |
| Commander | - | CLI (`src/cli/cli.ts`) |

Organisation de `apps/api/src`, avec un module NestJS par domaine :

| Dossiers | Rôle |
|----------|------|
| `config/` | Schéma des variables d'environnement, proxys de confiance, contournement 2FA |
| `auth/`, `users/`, `admin/` | Authentification better-auth, utilisateurs, administration |
| `common/`, `db/`, `schemas/`, `types/` | Décorateurs, guards, `PrismaService`, DTO Zod |
| `epcis/`, `epci-groups/`, `epci-neighbors/`, `bassin/` | Territoires |
| `scenarios/`, `simulations/`, `results/`, `preview/`, `share-links/` | Cœur métier : paramétrage, calcul et partage des simulations |
| `calculation/` | Moteur de calcul : coefficients, ratios, besoins en stock (B11–B15) et en flux (B21–B22), Sitadel |
| `rp-insee/`, `filocom/`, `sitadel/`, `bad-quality/`, `hosted/`, `no-accommodation/`, `financial-inadequation/`, `physical-inadequation/`, `vacancy/`, `household-sizes/`, `accommodation-rates/`, `demographic-evolution*/`, `projections/`, `data-pack-versions/` | Accès aux sources de données, par millésime |
| `export-excel/`, `export-powerpoint/` | Exports |
| `external/`, `consumers/` | API externe et clés d'API (`otelo_xxx`) |
| `email/`, `feedback/`, `statistics/`, `cron/`, `docurba/`, `health/` | Services transverses |
| `cli/` | Commandes en ligne de commande |
| `generated/` | Client Prisma généré (non versionné) |

### Frontend (`@otelo/web`)

| Technologie | Version | Usage |
|-------------|---------|-------|
| Next.js (App Router, sortie `standalone`) | 16.x | Framework React |
| React | 19.x | Librairie UI |
| DSFR (`@codegouvfr/react-dsfr`) | - | Design System de l'État |
| React Hook Form + Zod | - | Formulaires et validation |
| TanStack Query | 5.x | État serveur |
| Recharts | 3.x | Visualisation de données |
| Leaflet | 1.9.x | Cartographie |
| better-auth (client) | 1.6.x | Session côté front |

⚠️ Next.js 16 introduit des changements importants par rapport aux versions précédentes. Voir [`apps/web/AGENTS.md`](apps/web/AGENTS.md) et la documentation embarquée dans `node_modules/next/dist/docs/`.

Organisation de `apps/web/src` :

| Dossier | Rôle |
|---------|------|
| `app/(authenticated)/` | Pages connectées : simulations (création, modification, résultats), tableaux de bord, administration, territoires voisins… |
| `app/(unauthenticated)/` | Authentification, accueil, pages génériques (FAQ, guide, mentions légales), partage public (`partage/[token]`), contact |
| `app/api/` | Route handlers qui relaient les appels vers l'API (pattern BFF) |
| `components/` | Composants par fonctionnalité (simulations, charts, map, admin, onboarding, ui…) |
| `lib/` | Client et serveur d'authentification, client API, tracking Matomo |
| `server-only/` | Récupération de données côté serveur |
| `hooks/`, `helpers/`, `utils/`, `schemas/`, `types/`, `providers/`, `dsfr/` | Utilitaires |

**Flux front → API :**

- Le navigateur appelle uniquement le front (`localhost:3000`).
- Les routes `/api/auth/*` sont réécrites vers l'API par `next.config.mjs`.
- Les autres appels passent par les route handlers de `src/app/api/` ou par les fetchers de `src/server-only/`, qui appellent l'API côté serveur.

### Package partagé (`@shared`)

Types TypeScript et schémas Zod réutilisés par le front et le back. Il est compilé avec tsup (ESM et CJS).

- `schemas/` : résultats de calcul, entités (utilisateurs, EPCI, scénarios), taux, statistiques
- `enums/` : rôles, types d'utilisateurs, sources de données (B11, B14, B15, B17)
- `calculations/`, `auth/` : logique partagée (décomposition des estimations, 2FA)

Il doit être recompilé (`pnpm build:shared`) après toute modification, sauf si `pnpm -F @shared dev` tourne.

### API

- Préfixe global : `/api`
- Santé : `GET /api/health`
- Swagger interne : `/api/swagger` (routes d'administration exclues)
- Swagger externe : `/api/swagger-external`, pour les consommateurs authentifiés par une clé `Bearer otelo_xxx`. Documentation dans [`apps/api/src/docs/API_EXTERNAL.md`](apps/api/src/docs/API_EXTERNAL.md).

### Scripts

| Commande | Description |
|----------|-------------|
| `pnpm build:shared` | Compile `@shared` |
| `pnpm build:api` / `pnpm build:web` | Compile l'API ou le front (après `build:shared`) |
| `pnpm build` | Build de déploiement : `@shared`, puis l'app désignée par `BUILD_TARGET` |
| `pnpm lint` / `pnpm lint:fix` | Vérifie ou corrige le code avec Biome |
| `pnpm clean` | Supprime `node_modules`, `dist` et `.next` |
| `pnpm -F @otelo/api dev` | API en mode watch (après `sync-docurba`) |
| `pnpm -F @otelo/api start:debug` | API en mode debug |
| `pnpm -F @otelo/api cli <commande>` | CLI de l'API |
| `pnpm -F @otelo/api prisma <commande>` | CLI Prisma |
| `pnpm -F @otelo/web dev` | Front en mode développement |
| `pnpm -F @shared dev` / `typecheck` | Shared en watch, vérification des types |


## Authentification et accès

L'authentification repose sur **better-auth** (`apps/api/src/auth/better-auth.ts`), intégré à NestJS via `@thallesp/nestjs-better-auth`.

- **Email + mot de passe** : 8 caractères minimum, vérification de l'email obligatoire.
- **Double authentification par code email** : 6 chiffres, valable 10 minutes. Elle est exigée pour les utilisateurs ayant accès à l'application et pour les administrateurs.
- **ProConnect** : OIDC avec PKCE.
- **Plugin admin** : rôles `USER` et `ADMIN`, **impersonation** d'un utilisateur pendant 1 heure.
- **Sessions** : durée de 1 heure, rafraîchies toutes les 15 minutes, cookies préfixés `otelo`.
- **Rate limiting** : stocké en base, avec des règles par route.

Côté API, un `AuthorizationGuard` global protège les routes, et le décorateur `@AccessControl({ roles })` restreint par rôle.

**Accès à l'application (`hasAccess`)** : un compte créé n'a pas automatiquement accès aux simulations. L'accès est accordé :

- à l'inscription, si l'email figure dans la table `users_whitelist` ;
- par import CSV d'utilisateurs (administration) ;
- manuellement par un administrateur ;
- par la synchronisation des demandes d'accès Démarches Simplifiées. C'est un cron toutes les 12 heures, **en production uniquement**, qu'un administrateur peut aussi déclencher via `GET /api/cron/synchro`.


## Base de données et données de référence

- Schéma : [`apps/api/prisma/schema.prisma`](apps/api/prisma/schema.prisma)
- Configuration Prisma : `apps/api/prisma.config.ts`
- Migrations : `apps/api/prisma/migrations/`

```bash
# Créer une migration après modification du schéma
pnpm -F @otelo/api prisma migrate dev --name <nom>

# Appliquer les migrations (c'est ce que fait le déploiement)
pnpm -F @otelo/api prisma migrate deploy

# Régénérer le client après un changement de schéma ou un pull
pnpm -F @otelo/api exec prisma generate
```

**Millésimes.** Toutes les tables de données de référence sont versionnées par millésime (`DataPackVersion`, table `data_pack_versions`), par exemple `2021` ou `2024`. Un seul millésime est actif (`isActive`), et chaque scénario pointe vers un millésime. Un nouveau millésime est importé avec les commandes `import-csv` et `import-projections`, décrites ci-dessous.

Il n'existe pas de script de seed. Les données de référence viennent d'une sauvegarde de production ou des commandes d'import.


## CLI

Le projet dispose d'une interface en ligne de commande intégrée dans l'application API (`apps/api/src/cli/cli.ts`, commandes dans `apps/api/src/cli/commands/`).

```bash
# Depuis la racine du monorepo
pnpm -F api cli <commande>

# Ou depuis le dossier apps/api
cd apps/api && pnpm cli <commande>

# Aide
pnpm -F api cli --help
```

| Commande | Rôle |
|----------|------|
| [`import-backup`](#commande-import-backup) | Restaure la dernière sauvegarde de production Scalingo en local |
| [`recalculate-results`](#commande-recalculate-results) | Recalcule les résultats de simulation stockés |
| [`import-csv`](#commande-import-csv) | Importe un CSV dans une table de données versionnée par millésime |
| [`import-projections`](#commande-import-projections) | Importe les projections détaillées Omphale (XLSX) |
| [`sync-docurba`](#autres-commandes) | Synchronise les données Docurba |
| [`update-user-types`](#autres-commandes) | Met à jour en masse la typologie des utilisateurs |
| [`backfill-epcis-geo`](#autres-commandes) | Complète les départements des EPCI via l'API Geo |
| [`backfill-epci-contours`](#autres-commandes) | Complète les contours géographiques des EPCI |

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


### Autres commandes

```bash
# Docurba : télécharge les CSV (communes, SCoT, périmètres) dans apps/api/public/docurba/,
# les enregistre en base, et restaure depuis la base si le téléchargement échoue.
# Lancée automatiquement par `pnpm -F @otelo/api dev`.
pnpm -F api cli sync-docurba [--force]

# Typologie des utilisateurs depuis un CSV/XLSX (colonnes : email, typologie). Dry-run par défaut.
pnpm -F api cli update-user-types --file ./users.csv [--verbose] [--write]

# Départements des EPCI via l'API Geo. Dry-run par défaut.
pnpm -F api cli backfill-epcis-geo [--write]

# Contours géographiques des EPCI via l'API Geo. Par défaut, seuls les EPCI sans contour sont traités, en dry-run.
pnpm -F api cli backfill-epci-contours [--write] [--force]
```


## Tests

Seule l'API est testée. Elle utilise **Jest** avec ts-jest. Le front et `@shared` n'ont pas de tests automatisés.

```bash
# Tests unitaires (*.spec.ts), sans base de données
pnpm -F @otelo/api test
pnpm -F @otelo/api test:watch
pnpm -F @otelo/api test:cov

# Tests d'intégration (*.integration-spec.ts), avec une vraie base PostgreSQL
pnpm -F @otelo/api test:integration
```

- **Unitaires.** `test/jest-setup.ts` injecte des variables d'environnement factices et mocke better-auth. Les dépendances se mockent avec `@golevelup/ts-jest`.
- **Intégration.** Ils utilisent `INTEGRATION_DATABASE_URL`, par défaut `postgresql://otelo:otelo@localhost:5442/otelo-test`. Le docker-compose **ne crée pas** la base `otelo-test` : il faut la créer une fois à la main.

  ```bash
  docker compose -f apps/api/docker-compose.yml exec database createdb -U otelo otelo-test
  ```

  Le setup global applique le schéma avec `prisma db push`, et non avec les migrations (voir la remarque sur les données de référence).


## Qualité de code

Le lint et le formatage sont assurés par **Biome** (`biome.json`) ; il n'y a ni ESLint ni Prettier.

```bash
pnpm lint       # Vérifie tout le monorepo
pnpm lint:fix   # Corrige automatiquement
```

- **Formatage** : indentation de 2 espaces, lignes de 140 caractères, guillemets simples (doubles en JSX), pas de point-virgule, virgules finales, imports triés.
- **Règles notables** : `noExplicitAny` (erreur, sauf dans les specs), `noUnusedImports` et `noUnusedVariables` (erreur), `useConst`, `noVar`.
- Sont ignorés : `generated/`, `dist/`, `.next/`.
- `apps/web/.vscode/settings.json` configure Biome comme formateur, avec formatage à l'enregistrement. Installez l'extension Biome dans votre éditeur.

Il n'y a pas de hook git (husky, lint-staged) : lancez `pnpm lint` avant de pousser, car la CI le vérifie. La vérification de types n'existe en script que pour `@shared` (`pnpm -F @shared typecheck`). Pour l'API et le web, elle se fait au build.


## Workflow Git

- `dev` est la **branche par défaut** et la branche d'intégration : les PR la ciblent.
- `main` reçoit les mises en production, via des branches `release-JJ-MM-AA`.
- Nommage des branches : `feat/…`, `fix/…`, `chore/…`, `refactor/…`.
- Messages de commit sur une ligne, au format *conventional commits* : `feat: …`, `fix: …`, `chore: …`, `refactor: …`, éventuellement avec un scope (`feat(tracking): …`).


## CI et déploiement

### CircleCI (`.circleci/config.yml`)

Le workflow `otelo` tourne avec Node 24.22.1 et Postgres 16.4.

| Job | Contenu |
|-----|---------|
| `prepare_workspace_dependencies` | `pnpm install` avec cache |
| `lint` | `pnpm lint` |
| `test_api` | `prisma generate`, `build:shared`, tests unitaires |
| `test_api_integration` | Idem, avec une base `otelo-test`, puis `test:integration` |
| `build_api` | Build de l'API |
| `build_web` | Build du front (avec `apps/web/.env.dist` copié en `.env`) |

### Scalingo

L'API et le front sont déployés comme **deux applications Scalingo distinctes** à partir du même dépôt. La variable **`BUILD_TARGET`** (`@otelo/api` ou `@otelo/web`) indique quelle application construire.

| Fichier | Rôle |
|---------|------|
| `.buildpacks` | Buildpack apt, puis buildpack Node.js |
| `Aptfile` | Bibliothèques système nécessaires à Chrome (Puppeteer) |
| `Procfile` | `web: pnpm --filter $BUILD_TARGET run start` |
| `.slugignore` | Exclut `.circleci`, `.git` et `*.md` de l'image |
| `scripts/scalingo-postbuild.mjs` | Build de `@shared` et de la cible, puis nettoyage |

Le post-build :

- **API** : lance `prisma migrate deploy`, puis supprime le front, les sources et les migrations de l'image. Les migrations sont donc **appliquées automatiquement à chaque déploiement**.
- **Web** : copie `public/` et `.next/static/` dans la sortie `standalone` de Next.js, puis supprime les `node_modules`, l'API et le cache.

Les variables `NEXT_PUBLIC_*` du front doivent être configurées sur l'application Scalingo **avant** le build (voir [Variables d'environnement](#web-appswebenvlocal)).


## Services externes

| Service | Usage |
|---------|-------|
| Scalingo | Hébergement, base PostgreSQL, sauvegardes |
| Brevo | Emails transactionnels (templates) |
| ProConnect | Connexion des agents publics (OIDC) |
| Démarches Simplifiées | Demandes d'accès à l'application |
| Matomo (stats.beta.gouv.fr) | Mesure d'audience |
| Docurba | Documents d'urbanisme (SCoT, PLU, périmètres) |
| geo.api.gouv.fr, IGN Géoplateforme | Données géographiques et fonds de carte |


## Glossaire métier

| Terme | Définition |
|-------|------------|
| **EPCI** | Établissement public de coopération intercommunale, identifié par son SIREN à 9 chiffres. Unité principale d'analyse |
| **Bassin d'habitat** | Regroupement d'EPCI formant un marché du logement. Les projections Omphale existent aussi à ce niveau |
| **Groupe d'EPCI** (`EpciGroup`) | Ensemble d'EPCI défini par l'utilisateur, sur lequel porte une simulation |
| **Scénario** | Jeu de paramètres d'une simulation : année de projection, horizon de résorption du mal-logement (2050 par défaut), sources B11–B17, scénario démographique Omphale, millésime, taux par EPCI (vacance, résidences secondaires, renouvellement) |
| **Simulation** | Calcul nommé d'un scénario sur un ou plusieurs EPCI. Les résultats sont historisés et peuvent être partagés par lien |
| **Besoins en stock** | Besoins liés au mal-logement actuel, à résorber d'ici l'horizon choisi |
| B11 – Hors logement | Personnes sans logement : habitations de fortune, hôtel, sans-abri (sources RP, SNE) |
| B12 – Hébergés | Personnes hébergées chez des tiers, ou en structure (Filocom, FINESS, SNE) |
| B13 – Inadéquation financière | Ménages dont le taux d'effort pour le logement est excessif |
| B14 – Mauvaise qualité | Logements de mauvaise qualité ou inconfortables (Filocom, RP, Fichiers fonciers) |
| B15 – Inadéquation physique | Suroccupation des logements |
| B17 | Option de motif associée au calcul des besoins en stock |
| **Besoins en flux** | Besoins futurs : B21 pour l'évolution démographique (Omphale), B22 pour l'évolution du parc (renouvellement, résidences secondaires, vacance) |
| **Millésime** (`DataPackVersion`) | Version annuelle du jeu de données de référence |
| **Omphale** | Modèle de projection démographique de l'INSEE. Variantes de population : Central, PB (basse) et PH (haute), combinées à une tendance (`b2_scenario`, par exemple `Central_C`) |
| **RP** | Recensement de la population (INSEE) |
| **Filocom** | Fichier fiscal des logements et de leurs occupants |
| **Sitadel** | Base des permis de construire et des mises en chantier, pour comparer besoins et production |
| **FINESS** | Répertoire des établissements sanitaires et sociaux |
| **SNE** | Système national d'enregistrement des demandes de logement social |
| **Docurba** | Service des documents d'urbanisme (SCoT, PLU) |


## Documentation complémentaire

- [`SECURITE.md`](SECURITE.md) : état de la sécurité de l'application et points de vigilance.
- [`apps/web/src/lib/TRACKING.md`](apps/web/src/lib/TRACKING.md) : plan de tracking Matomo.
- [`apps/api/src/docs/API_EXTERNAL.md`](apps/api/src/docs/API_EXTERNAL.md) : API externe pour les consommateurs tiers.
- [`apps/web/AGENTS.md`](apps/web/AGENTS.md) : consignes pour les agents IA sur le front (Next.js 16).
- `apps/api/prisma/checks/` : requêtes SQL de contrôle après import.


## Pièges fréquents

| Symptôme | Cause / solution |
|----------|------------------|
| `EADDRINUSE :3000` ou le front appelle la mauvaise app | `PORT=4200` manquant dans `apps/api/.env` |
| `Configuration d'environnement invalide` au démarrage de l'API | Une variable obligatoire manque dans `apps/api/.env` (voir le tableau ci-dessus) |
| `Cannot find module '@shared'` ou des types partagés obsolètes | Lancer `pnpm build:shared` ou `pnpm -F @shared dev` |
| `Cannot find module '…/generated/prisma'` | Lancer `pnpm -F @otelo/api exec prisma generate` |
| Erreurs SQL sur des tables vides ou des clés étrangères | Base initialisée uniquement par migrations : restaurer une sauvegarde (`import-backup`) |
| L'API met du temps à démarrer ou échoue hors ligne | `sync-docurba` télécharge les fichiers Docurba à chaque `dev` |
| Pas d'email reçu en local | Comportement normal : lire les logs `[Brevo:skipped]`, avec `EMAIL_DEBUG_SECRETS=true` |
| Connecté mais sans accès aux simulations | `hasAccess` est à `false` : voir [Se connecter en local](#se-connecter-en-local) |
| L'export PowerPoint échoue | Chrome n'est pas installé pour Puppeteer : voir l'étape 6 du démarrage rapide |
| Matomo inactif en production | Variables `NEXT_PUBLIC_MATOMO_*` absentes au moment du build |
