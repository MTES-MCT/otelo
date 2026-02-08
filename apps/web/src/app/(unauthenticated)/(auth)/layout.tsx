import { fr } from '@codegouvfr/react-dsfr'
import { redirect } from 'next/navigation'
import { UnauthenticatedBreadcrumb } from '~/components/breadcrumbs/unauthenticated-breadcrumb'
import { getSession } from '~/lib/auth/server'

export default async function AuthLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession()

  // If user is already authenticated, redirect to accueil
  if (session) {
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
