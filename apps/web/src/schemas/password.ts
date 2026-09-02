import { TWO_FACTOR_CODE_LENGTH } from '@shared'
import z from 'zod'

export const ZForgotPasswordSchema = z.object({
  email: z.string().email('Adresse email invalide'),
})

export type TForgotPasswordForm = z.infer<typeof ZForgotPasswordSchema>

export const ZResetPassword = z
  .object({
    newPassword: z.string().min(8, 'Le mot de passe doit contenir au moins 8 caractères'),
    confirmPassword: z.string(),
    token: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Les mots de passe ne correspondent pas',
    path: ['confirmPassword'],
  })

export type TResetPassword = z.infer<typeof ZResetPassword>

export const ZTwoFactorCode = z.object({
  code: z.string().regex(new RegExp(`^\\d{${TWO_FACTOR_CODE_LENGTH}}$`), `Le code comporte ${TWO_FACTOR_CODE_LENGTH} chiffres.`),
})

export type TTwoFactorCode = z.infer<typeof ZTwoFactorCode>
