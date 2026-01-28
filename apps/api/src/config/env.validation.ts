import { z } from 'zod'

const ZEnvSchema = z.object({
  DATABASE_URL: z.string(),
  JWT_SECRET: z.string(),
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
})

export const validateEnvConfig = (config: Record<string, unknown>): Record<string, unknown> => ZEnvSchema.parse(config)
