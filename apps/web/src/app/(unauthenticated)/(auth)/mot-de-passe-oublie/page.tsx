import { Button } from '@codegouvfr/react-dsfr/Button'
import Link from 'next/link'
import { ForgotPasswordForm } from '~/components/auth/forgot-password-form'

export default function ForgotPasswordPage() {
  return (
    <div className="fr-container">
      <div className="fr-grid-row fr-grid-row--center">
        <div className="fr-col-12 fr-col-md-8 fr-col-lg-6">
          <ForgotPasswordForm />
          <div className="fr-flex fr-justify-content-center fr-mt-4w">
            <Link href="/connexion">
              <Button priority="secondary">Retour à la connexion</Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
