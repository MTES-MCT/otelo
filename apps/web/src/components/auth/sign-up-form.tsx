'use client'

import { Button } from '@codegouvfr/react-dsfr/Button'
import { Input } from '@codegouvfr/react-dsfr/Input'
import { ProConnectButton } from '@codegouvfr/react-dsfr/ProConnectButton'
import { zodResolver } from '@hookform/resolvers/zod'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { FC, useState } from 'react'
import { useForm } from 'react-hook-form'
import { RedAsterisk } from '~/components/ui/red-asterisk'
import { signIn, signUp } from '~/lib/auth/client'
import { TSignUp, ZSignUp } from '~/schemas/user'

export const SignUpForm: FC = () => {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [authError, setAuthError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<TSignUp>({
    resolver: zodResolver(ZSignUp),
  })

  const onSubmit = async (data: TSignUp) => {
    setIsLoading(true)
    setAuthError(null)
    try {
      const result = await signUp.email({
        email: data.email,
        password: data.password,
        name: `${data.firstname} ${data.lastname}`,
        firstname: data.firstname,
        lastname: data.lastname,
        hasAccess: false,
      })
      if (result.error) {
        setAuthError('unknown')
        return
      }

      router.push('/connexion')
    } catch (error) {
      console.error('Error signing up', error)
      setAuthError('unknown')
    } finally {
      setIsLoading(false)
    }
  }

  const onProConnectSignIn = async () => {
    try {
      await signIn.oauth2({
        providerId: 'proconnect',
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

            {!!authError && (
              <div className="fr-alert fr-alert--error fr-mb-3w" role="alert">
                <p className="fr-alert__title">Échec de la création du compte</p>
                <p>Une erreur est survenue.</p>
              </div>
            )}

            <div className="fr-flex fr-justify-content-space-between fr-align-items-center">
              <div className="fr-flex fr-direction-column fr-direction-sm-row fr-align-items-center fr-flex-gap-2v">
                <p className="fr-mb-0">Déjà un compte ?</p>
                <Link className="fr-link" href="/connexion">
                  Se connecter
                </Link>
              </div>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? 'Création en cours...' : 'Créer un compte'}
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
