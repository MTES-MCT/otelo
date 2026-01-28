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
