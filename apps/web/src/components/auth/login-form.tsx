'use client'

import { Button } from '@codegouvfr/react-dsfr/Button'
import { Input } from '@codegouvfr/react-dsfr/Input'
import { ProConnectButton } from '@codegouvfr/react-dsfr/ProConnectButton'
import { zodResolver } from '@hookform/resolvers/zod'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { FC, useState } from 'react'
import { useForm } from 'react-hook-form'
import z from 'zod'
import { RedAsterisk } from '~/components/ui/red-asterisk'
import { sendVerificationEmail, signIn } from '~/lib/auth/client'

const loginSchema = z.object({
  email: z.string().email('Adresse email invalide'),
  password: z.string().min(8, 'Le mot de passe doit contenir au moins 8 caractères'),
})

type LoginFormData = z.infer<typeof loginSchema>

export const LoginForm: FC = () => {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [authError, setAuthError] = useState<string | null>(null)
  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  })

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true)
    setAuthError(null)
    try {
      const result = await signIn.email({
        email: data.email,
        password: data.password,
      })

      const user = result.data?.user as { hasAccess?: boolean; role?: string } | undefined
      if (user && !user.hasAccess && user.role !== 'ADMIN') {
        router.push('/unauthorized')
        return
      }

      if (result.error) {
        const errorCode = result.error.code || result.error.message
        if (errorCode === 'USER_NOT_FOUND') {
          router.push('/unauthorized')
          return
        }
        if (errorCode === 'EMAIL_NOT_VERIFIED') {
          setAuthError('email_not_verified')
          return
        }
        if (errorCode === 'INVALID_PASSWORD' || errorCode === 'INVALID_CREDENTIALS') {
          setAuthError('invalid_password')
          return
        }
        setAuthError('unknown')
        return
      }

      // Success - redirect to dashboard (with type selection if needed)
      const userType = (result.data?.user as { type?: string } | undefined)?.type
      router.push(userType ? '/tableaux-de-bord' : '/tableaux-de-bord?selectType')
    } catch (error) {
      console.error('Error signing in', error)
      setAuthError('unknown')
    } finally {
      setIsLoading(false)
    }
  }

  const onProConnectSignIn = async () => {
    try {
      await signIn.oauth2({
        providerId: 'proconnect',
        callbackURL: '/tableaux-de-bord?selectType',
      })
    } catch (error) {
      console.error('Error signing in with ProConnect', error)
    }
  }

  const handleResendMail = async () => {
    const { email } = getValues()
    await sendVerificationEmail({ email })
  }

  const AUTH_ERRORS = {
    email_not_verified: (
      <>
        <span>
          Nous vous avons envoyé un e-mail de confirmation. Veuillez cliquer sur le lien qu'il contient pour activer votre compte. Si vous
          ne l'avez pas reçu, vous pouvez redemander un lien en utilisant le bouton ci-dessous :
        </span>
        <br />
        <Button className="fr-mt-2w" type="button" onClick={handleResendMail}>
          Renvoyer l'e-mail de confirmation
        </Button>
      </>
    ),
    invalid_password: 'Email ou mot de passe incorrect',
    unknown: 'Une erreur est survenue. Veuillez réessayer.',
  }

  return (
    <div className="fr-container">
      <div className="fr-flex fr-justify-content-space-between fr-direction-column fr-direction-md-row">
        <div className="fr-px-4w">
          <h1 className="fr-h3 fr-mb-3w">Connexion avec votre adresse email</h1>
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

            <Input
              label={
                <div className="fr-flex fr-direction-row fr-align-items-center fr-flex-gap-2v">
                  Mot de passe
                  <RedAsterisk />
                </div>
              }
              className="fr-mb-0"
              state={errors.password ? 'error' : 'default'}
              stateRelatedMessage={errors.password?.message}
              nativeInputProps={{
                ...register('password'),
                type: 'password',
                autoComplete: 'current-password',
              }}
            />
            <div className="fr-flex fr-justify-content-end fr-mb-2w">
              <Link className="fr-link" href="/mot-de-passe-oublie">
                Mot de passe oublié ?
              </Link>
            </div>

            {!!authError && (
              <div className="fr-alert fr-alert--error fr-mb-3w" role="alert">
                <p className="fr-alert__title">Échec de la connexion</p>
                <p>{AUTH_ERRORS[authError as keyof typeof AUTH_ERRORS] || 'Une erreur est survenue.'}</p>
              </div>
            )}
            <div className="fr-flex fr-justify-content-space-between fr-align-items-center">
              <div className="fr-flex fr-direction-column fr-direction-sm-row fr-align-items-center fr-flex-gap-2v">
                <p className="fr-mb-0">Première visite ?</p>
                <Link className="fr-link" href="/inscription">
                  Créer un compte
                </Link>
              </div>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? 'Connexion en cours...' : 'Se connecter'}
              </Button>
            </div>
          </form>
        </div>
        <div style={{ borderLeft: '1px solid var(--border-default-grey)' }}></div>
        <div className="fr-px-4w">
          <h2 className="fr-h3 fr-mb-3w">Connexion avec ProConnect</h2>
          <p className="fr-text--sm fr-mb-3w">Connectez-vous facilement avec votre compte ProConnect</p>
          <ProConnectButton onClick={onProConnectSignIn} />
        </div>
      </div>
    </div>
  )
}
