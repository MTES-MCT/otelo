import { fr } from '@codegouvfr/react-dsfr'
import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { UnauthenticatedBreadcrumb } from '~/components/breadcrumbs/unauthenticated-breadcrumb'
import { authOptions } from '~/lib/auth/auth.config'

export default async function AuthLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions)

  // If user is already authenticated, redirect to accueil
  if (session && !session.error) {
    redirect('/accueil')
  }

  return (
    <div style={{ backgroundColor: fr.colors.decisions.background.default.grey.default }}>
      <div className={fr.cx('fr-pt-6v', 'fr-pb-28v')}>
        <UnauthenticatedBreadcrumb />
        {children}
      </div>
    </div>
  )
}
