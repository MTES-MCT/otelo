'use client'

import { Button } from '@codegouvfr/react-dsfr/Button'
import Link from 'next/link'
import { useResendVerificationCodeEmail } from '~/hooks/use-resend-verification-email'

interface VerificationClientProps {
  code: string
  state: 'success' | 'invalid_code' | 'expired_code'
}

export function VerificationClient({ code, state }: VerificationClientProps) {
  const { mutateAsync } = useResendVerificationCodeEmail()

  const handleResendEmail = async () => {
    try {
      await mutateAsync(code)
    } catch {
      console.error("Erreur lors du renvoi de l'email")
    }
  }

  if (state === 'success') {
    return (
      <div className="fr-card fr-p-6w">
        <div className="fr-alert fr-alert--success fr-mb-4w">
          <p className="fr-alert__title">Email vérifié avec succès !</p>
          <p>Votre adresse email a été confirmée. Vous pouvez maintenant vous connecter à votre compte.</p>
        </div>
        <div className="fr-flex fr-justify-content-center">
          <Link href="/connexion">
            <Button>Se connecter</Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="fr-card fr-p-6w">
      <div className="fr-alert fr-alert--error fr-mb-4w">
        <p className="fr-alert__title">{state === 'expired_code' ? 'Code de vérification expiré' : 'Erreur de vérification'}</p>
        <p>
          {state === 'expired_code'
            ? 'Votre code de vérification a expiré. Vous pouvez demander un nouveau lien de confirmation.'
            : 'Le code de vérification est invalide ou a déjà été utilisé.'}
        </p>
      </div>

      <div className="fr-mb-4w fr-flex fr-justify-content-center">
        <Button type="button" onClick={handleResendEmail}>
          Renvoyer l'email de confirmation
        </Button>
      </div>

      <div className="fr-flex fr-justify-content-center">
        <Link href="/connexion" className="fr-link">
          Retour à la page de connexion
        </Link>
      </div>
    </div>
  )
}
