import { Metadata } from 'next'
import { SignUpForm } from '~/components/auth/sign-up-form'

export const metadata: Metadata = {
  title: "S'inscrire sur Otelo",
  description: 'Créez votre compte sur Otelo pour accéder à toutes les fonctionnalités.',
}

export default function PageInscription() {
  return (
    <div className="fr-container">
      <div className="fr-py-md-6w">
        <SignUpForm />
      </div>
    </div>
  )
}
