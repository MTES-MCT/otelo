'use client'

import { Button } from '@codegouvfr/react-dsfr/Button'
import { Input } from '@codegouvfr/react-dsfr/Input'
import { zodResolver } from '@hookform/resolvers/zod'
import { FC } from 'react'
import { useForm } from 'react-hook-form'
import { RedAsterisk } from '~/components/ui/red-asterisk'
import { useForgotPassword } from '~/hooks/use-forgot-password'
import { TForgotPasswordForm, ZForgotPasswordSchema } from '~/schemas/password'

export const ForgotPasswordForm: FC = () => {
  const { mutateAsync, isPending } = useForgotPassword()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<TForgotPasswordForm>({
    resolver: zodResolver(ZForgotPasswordSchema),
  })

  const onSubmit = async (data: TForgotPasswordForm) => {
    try {
      await mutateAsync(data.email)
    } catch (error) {
      console.error('Error sending forgot password email', error)
    }
  }

  return (
    <div>
      <h1 className="fr-h3 fr-mb-3w">Mot de passe oublié</h1>
      <p className="fr-text--sm fr-mb-4w">
        Saisissez votre adresse email et nous vous enverrons un lien pour réinitialiser votre mot de passe.
      </p>

      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <Input
          label={
            <div className="fr-flex fr-direction-row fr-align-items-center fr-flex-gap-2v">
              Adresse email
              <RedAsterisk />
            </div>
          }
          state={errors.email ? 'error' : 'default'}
          stateRelatedMessage={errors.email?.message}
          nativeInputProps={{
            ...register('email'),
            type: 'email',
            autoComplete: 'email',
            placeholder: 'nom@domaine.fr',
          }}
        />

        <div className="fr-flex fr-justify-content-center fr-align-items-center fr-mt-4w">
          <Button type="submit" disabled={isPending}>
            {isPending ? 'Envoi en cours...' : 'Envoyer le lien'}
          </Button>
        </div>
      </form>
    </div>
  )
}
