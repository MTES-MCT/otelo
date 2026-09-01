import { Metadata } from 'next'
import { TwoFactorForm } from '~/components/auth/two-factor-form'

export const metadata: Metadata = {
  title: 'Confirmation de connexion - Otelo',
  description: 'Confirmez votre connexion à Otelo.',
  // La page porte un code à usage unique dans son adresse : elle n'a rien à faire
  // dans un index de moteur de recherche.
  robots: { index: false, follow: false },
}

interface DoubleAuthentificationPageProps {
  searchParams: Promise<{ code?: string }>
}

export default async function DoubleAuthentificationPage({ searchParams }: DoubleAuthentificationPageProps) {
  const { code } = await searchParams

  return (
    <div className="fr-container fr-py-6w">
      <div className="fr-grid-row fr-grid-row--center">
        <div className="fr-col-12 fr-col-md-8 fr-col-lg-6">
          <TwoFactorForm codeFromLink={code} />
        </div>
      </div>
    </div>
  )
}
