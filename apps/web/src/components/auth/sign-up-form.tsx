'use client'

import { Button } from '@codegouvfr/react-dsfr/Button'
import { Input } from '@codegouvfr/react-dsfr/Input'
import { ProConnectButton } from '@codegouvfr/react-dsfr/ProConnectButton'
import { zodResolver } from '@hookform/resolvers/zod'
import Link from 'next/link'
import { signIn } from 'next-auth/react'
import { FC } from 'react'
import { useForm } from 'react-hook-form'
import { RedAsterisk } from '~/components/ui/red-asterisk'
import { useCreateUser } from '~/hooks/use-create-user'
import { proConnectProviderId } from '~/lib/auth/providers/pro-connect'
import { TSignUp, ZSignUp } from '~/schemas/user'

export const SignUpForm: FC = () => {
  const { isPending, mutateAsync } = useCreateUser()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<TSignUp>({
    resolver: zodResolver(ZSignUp),
  })

  const onSubmit = async (data: TSignUp) => {
    try {
      await mutateAsync(data)
    } catch (error) {
      console.error('Error signing up', error)
    }
  }

  const onProConnectSignIn = async () => {
    try {
      await signIn(proConnectProviderId, {
        callbackUrl: '/tableaux-de-bord',
      })
    } catch (error) {
      console.error('Error signing in with ProConnect', error)
    }
  }

  return (
    <div className="fr-container">
      <div className="fr-flex fr-justify-content-space-between fr-direction-column fr-direction-md-row">
        <div>
          <h1 className="fr-h3 fr-mb-3w">Créer un compte avec votre adresse email</h1>
          <form onSubmit={handleSubmit(onSubmit)} noValidate>
            <Input
              label={
                <div className="fr-flex fr-direction-row fr-align-items-center fr-flex-gap-2v">
                  Prénom
                  <RedAsterisk />
                </div>
              }
              state={errors.firstname ? 'error' : 'default'}
              stateRelatedMessage={errors.firstname?.message}
              nativeInputProps={{
                ...register('firstname'),
                type: 'text',
                autoComplete: 'given-name',
                placeholder: 'Jean',
              }}
            />

            <Input
              label={
                <div className="fr-flex fr-direction-row fr-align-items-center fr-flex-gap-2v">
                  Nom
                  <RedAsterisk />
                </div>
              }
              state={errors.lastname ? 'error' : 'default'}
              stateRelatedMessage={errors.lastname?.message}
              nativeInputProps={{
                ...register('lastname'),
                type: 'text',
                autoComplete: 'family-name',
                placeholder: 'Dupont',
              }}
            />

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

            <Input
              label={
                <div className="fr-flex fr-direction-row fr-align-items-center fr-flex-gap-2v">
                  Mot de passe
                  <RedAsterisk />
                </div>
              }
              state={errors.password ? 'error' : 'default'}
              stateRelatedMessage={errors.password?.message}
              nativeInputProps={{
                ...register('password'),
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

            <div className="fr-flex fr-justify-content-space-between fr-align-items-center">
              <div className="fr-flex fr-direction-column fr-direction-sm-row fr-align-items-center fr-flex-gap-2v">
                <p className="fr-mb-0">Déjà un compte ?</p>
                <Link className="fr-link" href="/connexion">
                  Se connecter
                </Link>
              </div>
              <Button type="submit" disabled={isPending}>
                {isPending ? 'Création en cours...' : 'Créer un compte'}
              </Button>
            </div>
          </form>
        </div>
        <div style={{ borderLeft: '1px solid var(--border-default-grey)' }}></div>
        <div className="fr-px-4w">
          <h2 className="fr-h3 fr-mb-3w">Créer un compte avec ProConnect</h2>
          <p className="fr-text--sm fr-mb-3w">Créez votre compte en quelques clics avec ProConnect</p>
          <ProConnectButton onClick={onProConnectSignIn} />
        </div>
      </div>
    </div>
  )
}
