'use client'

import { Button } from '@codegouvfr/react-dsfr/Button'
import { Input } from '@codegouvfr/react-dsfr/Input'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { FC, useCallback, useEffect, useRef, useState } from 'react'
import { getSession, twoFactor } from '~/lib/auth/client'

/**
 * Trois issues possibles, volontairement distinguées : la marche à suivre n'est pas
 * la même, et un message unique enverrait la personne dans la mauvaise direction.
 *
 * - `expired_code`   : le code a plus de dix minutes, ou trop d'essais infructueux.
 *                      Un nouveau code suffit, sans ressaisir le mot de passe.
 * - `expired_login`  : la fenêtre de connexion de quinze minutes est close. Le serveur
 *                      n'a plus trace de la demande : il faut repasser par le mot de passe.
 * - `invalid_code`   : code erroné. La personne réessaie.
 */
type TwoFactorError = 'expired_code' | 'expired_login' | 'invalid_code' | 'resend_failed' | 'unknown'

const CODE_LENGTH = 6
// Le serveur plafonne les appels à `/two-factor/*`. Ce délai garde le bouton cohérent
// avec ce plafond plutôt que de laisser l'utilisateur déclencher un refus.
const RESEND_COOLDOWN_SECONDS = 15

interface TwoFactorFormProps {
  codeFromLink?: string
}

export const TwoFactorForm: FC<TwoFactorFormProps> = ({ codeFromLink }) => {
  const router = useRouter()
  const [code, setCode] = useState(codeFromLink ?? '')
  const [isVerifying, setIsVerifying] = useState(false)
  const [isResending, setIsResending] = useState(false)
  const [error, setError] = useState<TwoFactorError | null>(null)
  const [resendCooldown, setResendCooldown] = useState(0)
  const [resendConfirmation, setResendConfirmation] = useState(false)
  // Le lien ne doit déclencher la vérification qu'une fois : sans ce garde-fou, un
  // nouveau rendu relancerait un appel et consommerait une tentative pour rien.
  const hasAutoSubmitted = useRef(false)

  const redirectAfterLogin = useCallback(async () => {
    const session = await getSession()
    const user = session.data?.user as { hasAccess?: boolean; role?: string; type?: string } | undefined

    if (user && !user.hasAccess && user.role !== 'ADMIN') {
      router.push('/unauthorized')
      return
    }

    router.push(user?.type ? '/tableaux-de-bord' : '/tableaux-de-bord?selectType')
  }, [router])

  const verify = useCallback(
    async (value: string) => {
      setIsVerifying(true)
      setError(null)
      setResendConfirmation(false)

      try {
        const result = await twoFactor.verifyOtp({ code: value })

        if (result.error) {
          const errorCode = result.error.code || ''
          if (errorCode === 'INVALID_TWO_FACTOR_COOKIE') {
            setError('expired_login')
          } else if (errorCode === 'OTP_HAS_EXPIRED' || errorCode === 'TOO_MANY_ATTEMPTS_REQUEST_NEW_CODE') {
            setError('expired_code')
          } else if (errorCode === 'INVALID_CODE') {
            setError('invalid_code')
          } else {
            setError('unknown')
          }
          return
        }

        await redirectAfterLogin()
      } catch (err) {
        console.error('Error verifying two-factor code', err)
        setError('unknown')
      } finally {
        setIsVerifying(false)
      }
    },
    [redirectAfterLogin],
  )

  // Le code arrivé par le lien est vérifié sans intervention, puis retiré de l'adresse :
  // il n'a pas à rester dans l'historique du navigateur ni à partir dans un copier-coller
  // de l'URL.
  useEffect(() => {
    if (!codeFromLink || hasAutoSubmitted.current) {
      return
    }
    hasAutoSubmitted.current = true
    window.history.replaceState(null, '', '/connexion/double-authentification')
    verify(codeFromLink)
  }, [codeFromLink, verify])

  useEffect(() => {
    if (resendCooldown <= 0) {
      return
    }
    const timer = setTimeout(() => setResendCooldown((value) => value - 1), 1000)
    return () => clearTimeout(timer)
  }, [resendCooldown])

  const handleResend = async () => {
    setIsResending(true)
    setError(null)
    setResendConfirmation(false)

    try {
      const result = await twoFactor.sendOtp()

      if (result.error) {
        // Le serveur refuse aussi le renvoi quand la fenêtre de connexion est close :
        // la marche à suivre redevient « se reconnecter ».
        setError(result.error.code === 'INVALID_TWO_FACTOR_COOKIE' ? 'expired_login' : 'resend_failed')
        return
      }

      setCode('')
      setResendConfirmation(true)
      setResendCooldown(RESEND_COOLDOWN_SECONDS)
    } catch (err) {
      console.error('Error resending two-factor code', err)
      setError('resend_failed')
    } finally {
      setIsResending(false)
    }
  }

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault()
    if (code.length === CODE_LENGTH) {
      verify(code)
    }
  }

  if (error === 'expired_login') {
    return (
      <>
        <h1 className="fr-h3">Votre demande de connexion a expiré</h1>
        <div className="fr-alert fr-alert--warning fr-mb-3w" role="alert">
          <p>
            Par sécurité, une demande de connexion n'est valable que quinze minutes. Au-delà, votre mot de passe doit être saisi à nouveau.
          </p>
        </div>
        <Link className="fr-btn" href="/connexion">
          Retourner à la page de connexion
        </Link>
      </>
    )
  }

  if (isVerifying && codeFromLink) {
    return (
      <>
        <h1 className="fr-h3">Confirmation de votre connexion…</h1>
        <p>Merci de patienter quelques instants.</p>
      </>
    )
  }

  return (
    <>
      <h1 className="fr-h3">Confirmez votre connexion</h1>
      <p>
        Un e-mail vient de vous être envoyé. Cliquez sur le lien qu'il contient pour confirmer votre connexion, ou recopiez ci-dessous le
        code à {CODE_LENGTH} chiffres qui s'y trouve.
      </p>
      <p className="fr-text--sm fr-text-mention--grey">
        Vous avez ouvert cet e-mail sur un autre appareil&nbsp;? Le lien ne fonctionnera que dans ce navigateur&nbsp;: utilisez le code.
      </p>

      {error === 'expired_code' && (
        <div className="fr-alert fr-alert--warning fr-mb-3w" role="alert">
          <p className="fr-alert__title">Ce code n'est plus valable</p>
          <p>Un code est valable dix minutes. Demandez-en un nouveau pour terminer votre connexion.</p>
        </div>
      )}

      {error === 'invalid_code' && (
        <div className="fr-alert fr-alert--error fr-mb-3w" role="alert">
          <p>Ce code est incorrect. Vérifiez votre saisie ou demandez un nouveau code.</p>
        </div>
      )}

      {error === 'resend_failed' && (
        <div className="fr-alert fr-alert--error fr-mb-3w" role="alert">
          <p>L'envoi du nouveau code a échoué. Veuillez réessayer dans quelques instants.</p>
        </div>
      )}

      {error === 'unknown' && (
        <div className="fr-alert fr-alert--error fr-mb-3w" role="alert">
          <p>Une erreur est survenue. Veuillez réessayer.</p>
        </div>
      )}

      {resendConfirmation && (
        <div className="fr-alert fr-alert--success fr-mb-3w" role="alert">
          <p>Un nouveau code vient de vous être envoyé.</p>
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate>
        <Input
          label={`Code à ${CODE_LENGTH} chiffres`}
          nativeInputProps={{
            value: code,
            onChange: (event) => setCode(event.target.value.replace(/\D/g, '').slice(0, CODE_LENGTH)),
            inputMode: 'numeric',
            autoComplete: 'one-time-code',
            autoFocus: true,
            placeholder: '000000',
          }}
        />

        <div className="fr-flex fr-align-items-center fr-flex-gap-2v fr-mt-2w">
          <Button type="submit" disabled={isVerifying || code.length !== CODE_LENGTH}>
            {isVerifying ? 'Vérification…' : 'Confirmer ma connexion'}
          </Button>
          <Button type="button" priority="secondary" disabled={isResending || resendCooldown > 0} onClick={handleResend}>
            {resendCooldown > 0 ? `Renvoyer un code (${resendCooldown}s)` : 'Renvoyer un code'}
          </Button>
        </div>
      </form>
    </>
  )
}
