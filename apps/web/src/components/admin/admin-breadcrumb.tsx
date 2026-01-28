'use client'

import Breadcrumb from '@codegouvfr/react-dsfr/Breadcrumb'
import { usePathname } from 'next/navigation'

export const AdminBreadcrumb = () => {
  const pathname = usePathname()

  const getCurrentPageLabel = () => {
    if (pathname.includes('/gestion-des-utilisateurs')) {
      return 'Gestion des utilisateurs'
    }
    if (pathname.includes('/statistiques')) {
      return 'Statistiques'
    }
    return 'Administration'
  }

  const getSegments = () => {
    if (pathname === '/admin') {
      return []
    }
    return [
      {
        label: 'Administration',
        linkProps: { href: '/admin' },
      },
    ]
  }

  return (
    <Breadcrumb
      currentPageLabel={getCurrentPageLabel()}
      homeLinkProps={{
        href: '/accueil',
      }}
      segments={getSegments()}
    />
  )
}
