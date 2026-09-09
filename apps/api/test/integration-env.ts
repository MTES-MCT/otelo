import { INTEGRATION_DATABASE_URL } from './integration-database'

/**
 * Chargé après `jest-setup.ts`, dont il ne conserve que la base de données.
 *
 * `PrismaService` lit `env.DATABASE_URL`, figé au chargement de `~/config/env` : la
 * variable doit donc être posée avant que le moindre module applicatif s'importe.
 */
process.env.DATABASE_URL = INTEGRATION_DATABASE_URL
