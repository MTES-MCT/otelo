/**
 * L'environnement des tests, déclaré ici plutôt que subi.
 *
 * `~/config/env` valide et fige les variables au chargement du module ; ce fichier
 * s'exécute avant, via `setupFiles`. Les tests ne dépendent donc ni du `.env` de la
 * machine — absent en intégration continue, renseigné et différent en local — ni de
 * l'ordre dans lequel les modules s'importent.
 *
 * Les valeurs sont volontairement reconnaissables : si l'une d'elles apparaît dans une
 * requête sortante, l'origine du problème se lit dans le message.
 */
Object.assign(process.env, {
  API_KEY_ENCRYPTION_SECRET: 'test-secret-for-unit-tests',
  BETTER_AUTH_SECRET: 'test-better-auth-secret',
  BREVO_API_KEY: 'cle',
  BREVO_API_URL: 'https://brevo.test/send',
  BREVO_EMAIL_VERIFICATION_TEMPLATE_ID: '1',
  BREVO_IMPORT_USER_TEMPLATE_ID: '2',
  BREVO_PASSWORD_RESET_TEMPLATE_ID: '3',
  BREVO_TWO_FACTOR_TEMPLATE_ID: '42',
  CLIENT_BASE_URL: 'https://otelo.test',
  DATABASE_URL: 'postgresql://otelo:otelo@localhost:5442/otelo-test',
  DEMARCHES_SIMPLIFIEES_DEMARCHE_ID: '0',
  DEMARCHES_SIMPLIFIEES_TOKEN: 'jeton-ds',
  DEMARCHES_SIMPLIFIEES_URL: 'https://demarches.test/graphql',
  EMAIL_ENABLED: 'true',
  EMAIL_RECEIVER_EMAIL: 'destinataire@otelo.test',
  EMAIL_SENDER_EMAIL: 'expediteur@otelo.test',
  EMAIL_SENDER_NAME: 'Otelo',
  OAUTH_PROCONNECT_CLIENT_ID: 'client-proconnect',
  OAUTH_PROCONNECT_CLIENT_SECRET: 'secret-proconnect',
  OAUTH_PROCONNECT_ISSUER: 'https://proconnect.test',
})

jest.mock('~/auth/better-auth', () => ({
  auth: {
    api: {
      requestPasswordReset: jest.fn().mockResolvedValue({}),
    },
  },
  sendBrevoTemplatedEmail: jest.fn().mockResolvedValue(undefined),
  checkWhitelistBeforeCreate: jest.fn(),
  updateLastLoginAt: jest.fn(),
}))
