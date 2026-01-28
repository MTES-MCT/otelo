import 'next-auth'
import { z } from 'zod'

export const ZSession = z.object({
  accessToken: z.string(),
  error: z.string().nullable(),
  expires: z.string(),
  refreshToken: z.string(),
  user: z.object({
    email: z.string().nullable(),
    image: z.string().nullable(),
    name: z.string().nullable(),
    firstname: z.string(),
    lastname: z.string(),
    sub: z.string(),
    hasAccess: z.boolean(),
    id: z.string(),
    provider: z.string(),
    role: z.enum(['ADMIN', 'USER']).optional(),
    type: z.enum(['DDT', 'AgenceUrbanisme', 'Collectivite', 'DREAL', 'BureauEtudes']).optional(),
  }),
  impersonatedUserId: z.string().optional(),
  impersonatorId: z.string().optional(),
})

export type TSession = z.infer<typeof ZSession>

declare module 'next-auth' {
  interface Session extends TSession {}

  interface User {
    firstname: string
    lastname: string
    sub: string
    id: string
    email: string
    provider: string
    role: 'ADMIN' | 'USER'
    type?: 'DDT' | 'AgenceUrbanisme' | 'Collectivite' | 'DREAL' | 'BureauEtudes'
  }
}
