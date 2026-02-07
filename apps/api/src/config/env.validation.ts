import { z } from 'zod'

const ZEnvSchema = z.object({
  DATABASE_URL: z.string(),
  NODE_ENV: z.string(),
  PORT: z.string().transform((val) => parseInt(val)),
  BREVO_API_KEY: z.string(),
  BREVO_API_URL: z.string(),
  EMAIL_SENDER_NAME: z.string(),
  EMAIL_SENDER_EMAIL: z.string(),
  EMAIL_RECEIVER_EMAIL: z.string(),
  DEMARCHES_SIMPLIFIEES_URL: z.string(),
  DEMARCHES_SIMPLIFIEES_TOKEN: z.string(),
  DEMARCHES_SIMPLIFIEES_DEMARCHE_ID: z.string(),
  CLIENT_BASE_URL: z.string(),
  BREVO_EMAIL_VERIFICATION_TEMPLATE_ID: z.string(),
  BREVO_PASSWORD_RESET_TEMPLATE_ID: z.string(),
  OAUTH_PROCONNECT_CLIENT_ID: z.string(),
  OAUTH_PROCONNECT_CLIENT_SECRET: z.string(),
  OAUTH_PROCONNECT_ISSUER: z.string(),
})

export const validateEnvConfig = (config: Record<string, unknown>): Record<string, unknown> => ZEnvSchema.parse(config)
