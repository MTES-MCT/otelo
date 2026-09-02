'use client'

import Alert, { type AlertProps } from '@codegouvfr/react-dsfr/Alert'
import { Button } from '@codegouvfr/react-dsfr/Button'
import { Input } from '@codegouvfr/react-dsfr/Input'
import { zodResolver } from '@hookform/resolvers/zod'
import { TWO_FACTOR_CODE_LENGTH } from '@shared'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { FC, useEffect, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { twoFactor } from '~/lib/auth/client'
import { postLoginDestination } from '~/lib/auth/post-login-destination'
import { TTwoFactorCode, ZTwoFactorCode } from '~/schemas/password'

const NOTICES = {
  // Code de plus de dix minutes, ou trop d'essais infructueux : un nouveau code suffit,
  // sans ressaisir le mot de passe.
  expired_code: {
    severity: 'warning',
    title: "Ce code n'est plus valable",
    description: 'Un code est valable dix minutes. Demandez-en un nouveau pour terminer votre connexion.',
  },
  // Code erroné : la personne réessaie.
  invalid_code: {
    small: true,
    severity: 'error',
    description: 'Ce code est incorrect. Vérifiez votre saisie ou demandez un nouveau code.',
  },
  resend_failed: {
    small: true,
    severity: 'error',
    description: "L'envoi du nouveau code a échoué. Veuillez réessayer dans quelques instants.",
  },
  unknown: {
    small: true,
    severity: 'error',
    description: 'Une erreur est survenue. Veuillez réessayer.',
  },
  code_resent: {
    small: true,
    severity: 'success',
    description: 'Un nouveau code vient de vous être envoyé.',
  },
} as const satisfies Record<string, AlertProps>

type Notice = keyof typeof NOTICES | 'expired_login'

const NOTICE_BY_ERROR_CODE: Record<string, Notice> = {
  INVALID_CODE: 'invalid_code',
  INVALID_TWO_FACTOR_COOKIE: 'expired_login',
  OTP_HAS_EXPIRED: 'expired_code',
  TOO_MANY_ATTEMPTS_REQUEST_NEW_CODE: 'expired_code',
}

const RESEND_COOLDOWN_SECONDS = 15

interface TwoFactorFormProps {
  codeFromLink?: string
}

export const TwoFactorForm: FC<TwoFactorFormProps> = ({ codeFromLink }) => {
  const router = useRouter()
  const {
    formState: { errors },
    handleSubmit,
    register,
    resetField,
    setValue,
  } = useForm<TTwoFactorCode>({
    defaultValues: { code: codeFromLink ?? '' },
    resolver: zodResolver(ZTwoFactorCode),
  })
  // Un seul appel est en cours à la fois : les deux boutons se désactivent ensemble.
  const [pending, setPending] = useState<'resend' | 'verify' | null>(null)
  const [notice, setNotice] = useState<Notice | null>(null)
  const [resendCooldown, setResendCooldown] = useState(0)
  // Le lien ne doit déclencher la vérification qu'une fois : sans ce garde-fou, un
  // nouveau rendu relancerait un appel et consommerait une tentative pour rien.
  const hasAutoSubmitted = useRef(false)

  const verify = async (value: string) => {
    setPending('verify')
    setNotice(null)

    try {
      const result = await twoFactor.verifyOtp({ code: value })

      if (result.error) {
        setNotice(NOTICE_BY_ERROR_CODE[result.error.code ?? ''] ?? 'unknown')
        return
      }

      // `verifyOtp` renvoie déjà l'utilisateur, champs additionnels compris : relire la
      // session ajouterait un aller-retour réseau au milieu d'une connexion aboutie,
      // pendant lequel l'écran reste sur « Confirmation… ».
      router.push(postLoginDestination(result.data?.user))
    } catch (err) {
      console.error('Error verifying two-factor code', err)
      setNotice('unknown')
    } finally {
      setPending(null)
    }
  }

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
  }, [codeFromLink])

  useEffect(() => {
    if (resendCooldown <= 0) {
      return
    }
    const timer = setTimeout(() => setResendCooldown((value) => value - 1), 1000)
    return () => clearTimeout(timer)
  }, [resendCooldown])

  const handleResend = async () => {
    setPending('resend')
    setNotice(null)

    try {
      const result = await twoFactor.sendOtp()

      if (result.error) {
        // Le serveur refuse aussi le renvoi quand la fenêtre de connexion est close :
        // la marche à suivre redevient « se reconnecter ».
        const notice = NOTICE_BY_ERROR_CODE[result.error.code ?? '']
        setNotice(notice === 'expired_login' ? notice : 'resend_failed')
        return
      }

      resetField('code')
      setNotice('code_resent')
      setResendCooldown(RESEND_COOLDOWN_SECONDS)
    } catch (err) {
      console.error('Error resending two-factor code', err)
      setNotice('resend_failed')
    } finally {
      setPending(null)
    }
  }

  if (notice === 'expired_login') {
    return (
      <>
        <h1 className="fr-h3">Votre demande de connexion a expiré</h1>
        <Alert
          className="fr-mb-3w"
          description="Par sécurité, une demande de connexion n'est valable que quinze minutes. Au-delà, votre mot de passe doit être saisi à nouveau."
          severity="warning"
          small
        />
        <Link className="fr-btn" href="/connexion">
          Retourner à la page de connexion
        </Link>
      </>
    )
  }

  if (pending === 'verify' && codeFromLink) {
    return (
      <>
        <h1 className="fr-h3">Confirmation de votre connexion…</h1>
        <p>Merci de patienter quelques instants.</p>
      </>
    )
  }

  const displayedNotice = notice === null ? null : NOTICES[notice]

  return (
    <>
      <h1 className="fr-h3">Confirmez votre connexion</h1>
      <p>
        Un e-mail vient de vous être envoyé. Cliquez sur le lien qu'il contient pour confirmer votre connexion, ou recopiez ci-dessous le
        code à {TWO_FACTOR_CODE_LENGTH} chiffres qui s'y trouve.
      </p>
      <p className="fr-text--sm fr-text-mention--grey">
        Vous avez ouvert cet e-mail sur un autre appareil&nbsp;? Le lien ne fonctionnera que dans ce navigateur&nbsp;: utilisez le code.
      </p>

      {displayedNotice && <Alert className="fr-mb-3w" {...displayedNotice} />}

      <form onSubmit={handleSubmit(({ code }) => verify(code))} noValidate>
        <Input
          label={`Code à ${TWO_FACTOR_CODE_LENGTH} chiffres`}
          state={errors.code ? 'error' : 'default'}
          stateRelatedMessage={errors.code?.message}
          nativeInputProps={{
            // La saisie reste bornée aux chiffres et à la longueur attendue : le schéma
            // décrit ce qui est acceptable, la frappe évite d'y arriver par erreur.
            ...register('code', {
              onChange: (event) => setValue('code', event.target.value.replace(/\D/g, '').slice(0, TWO_FACTOR_CODE_LENGTH)),
            }),
            inputMode: 'numeric',
            autoComplete: 'one-time-code',
            autoFocus: true,
            placeholder: '000000',
          }}
        />

        <div className="fr-flex fr-align-items-center fr-flex-gap-2v fr-mt-2w">
          <Button type="submit" disabled={pending !== null}>
            {pending === 'verify' ? 'Vérification…' : 'Confirmer ma connexion'}
          </Button>
          <Button type="button" priority="secondary" disabled={pending !== null || resendCooldown > 0} onClick={handleResend}>
            {resendCooldown > 0 ? `Renvoyer un code (${resendCooldown}s)` : 'Renvoyer un code'}
          </Button>
        </div>
      </form>
    </>
  )
}
