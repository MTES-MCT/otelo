import { validateEnvConfig } from '~/config/env.validation'

export default () =>
  validateEnvConfig({
    DATABASE_URL: process.env.DATABASE_URL,
    JWT_SECRET: process.env.JWT_SECRET,
    NODE_ENV: process.env.NODE_ENV,
    PORT: process.env.PORT,
    BREVO_API_KEY: process.env.BREVO_API_KEY,
    BREVO_API_URL: process.env.BREVO_API_URL,
    EMAIL_SENDER_NAME: process.env.EMAIL_SENDER_NAME,
    EMAIL_SENDER_EMAIL: process.env.EMAIL_SENDER_EMAIL,
    EMAIL_RECEIVER_EMAIL: process.env.EMAIL_RECEIVER_EMAIL,
    DEMARCHES_SIMPLIFIEES_URL: process.env.DEMARCHES_SIMPLIFIEES_URL,
    DEMARCHES_SIMPLIFIEES_TOKEN: process.env.DEMARCHES_SIMPLIFIEES_TOKEN,
    DEMARCHES_SIMPLIFIEES_DEMARCHE_ID: process.env.DEMARCHES_SIMPLIFIEES_DEMARCHE_ID,
  })
