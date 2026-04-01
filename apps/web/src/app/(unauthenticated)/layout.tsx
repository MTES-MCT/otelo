'use client'

import { fr } from '@codegouvfr/react-dsfr'
import { usePathname } from 'next/navigation'
import { UnauthenticatedBreadcrumb } from '~/components/breadcrumbs/unauthenticated-breadcrumb'

export default function UnauthenticatedLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isSharePage = pathname.startsWith('/partage')

  if (isSharePage) {
    return (
      <div style={{ backgroundColor: 'var(--artwork-decorative-blue-france)', flex: 1 }} className="fr-py-md-5w fr-py-2w">
        {children}
      </div>
    )
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
