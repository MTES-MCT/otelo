/**
 * Base de données des tests d'intégration.
 *
 * Par défaut, la base `otelo-test` du Postgres de développement (`docker-compose.yml`),
 * distincte de la base `otelo` pour que `--force-reset` ne touche jamais aux données de
 * travail. L'intégration continue fournit sa propre URL via `INTEGRATION_DATABASE_URL`.
 */
export const INTEGRATION_DATABASE_URL = process.env.INTEGRATION_DATABASE_URL ?? 'postgresql://otelo:otelo@localhost:5442/otelo-test'
