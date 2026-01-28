'use client'

import { Button } from '@codegouvfr/react-dsfr/Button'
import { Input } from '@codegouvfr/react-dsfr/Input'
import { zodResolver } from '@hookform/resolvers/zod'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { RedAsterisk } from '~/components/ui/red-asterisk'
import { useResetPassword } from '~/hooks/use-reset-password'
import { TResetPassword, ZResetPassword } from '~/schemas/password'

interface ResetPasswordFormProps {
  token: string | undefined
  tokenState: 'valid' | 'invalid_token' | 'missing_token'
}

export function ResetPasswordForm({ token, tokenState }: ResetPasswordFormProps) {
  const { mutateAsync, isPending } = useResetPassword()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<TResetPassword>({
    resolver: zodResolver(ZResetPassword),
    defaultValues: {
      token,
    },
  })

  const onSubmit = async (data: TResetPassword) => {
    try {
      await mutateAsync(data)
    } catch (error) {
      console.error('Error resetting password', error)
    }
  }

  if (tokenState !== 'valid') {
    return (
      <div className="fr-card fr-p-6w">
        <div className="fr-alert fr-alert--error fr-mb-4w">
          <h3 className="fr-alert__title">Lien invalide</h3>
          <p>
            {tokenState === 'missing_token'
              ? 'Token manquant. Veuillez utiliser le lien fourni dans votre email.'
              : 'Le lien de réinitialisation est invalide ou a expiré.'}
          </p>
        </div>
        <div className="fr-flex fr-justify-content-center">
          <Link href="/mot-de-passe-oublie">
            <Button priority="secondary">Demander un nouveau lien</Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="fr-card fr-p-6w">
      <h1 className="fr-h3 fr-mb-3w">Réinitialisation du mot de passe</h1>
      <p className="fr-text--sm fr-mb-4w">Saisissez votre nouveau mot de passe.</p>

      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <Input
          label={
            <div className="fr-flex fr-direction-row fr-align-items-center fr-flex-gap-2v">
              Nouveau mot de passe
              <RedAsterisk />
            </div>
          }
          state={errors.newPassword ? 'error' : 'default'}
          stateRelatedMessage={errors.newPassword?.message}
          nativeInputProps={{
            ...register('newPassword'),
            type: 'password',
            autoComplete: 'new-password',
          }}
        />

        <Input
          label={
            <div className="fr-flex fr-direction-row fr-align-items-center fr-flex-gap-2v">
              Confirmer le mot de passe
              <RedAsterisk />
            </div>
          }
          state={errors.confirmPassword ? 'error' : 'default'}
          stateRelatedMessage={errors.confirmPassword?.message}
          nativeInputProps={{
            ...register('confirmPassword'),
            type: 'password',
            autoComplete: 'new-password',
          }}
        />

        <div className="fr-flex fr-justify-content-space-between fr-align-items-center fr-mt-4w">
          <Link className="fr-link" href="/connexion">
            Retour à la connexion
          </Link>
          <Button type="submit" disabled={isPending}>
            {isPending ? 'Modification en cours...' : 'Modifier le mot de passe'}
          </Button>
        </div>
      </form>
    </div>
  )
}
