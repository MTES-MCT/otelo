'use client'

import { fr } from '@codegouvfr/react-dsfr'
import Breadcrumb from '@codegouvfr/react-dsfr/Breadcrumb'
import { usePathname } from 'next/navigation'

export const UnauthenticatedBreadcrumb = () => {
  const pathname = usePathname()

  const labelsMap: Record<string, string> = {
    accessibilite: 'Accessibilité',
    guide: 'Guide Otelo',
    ressources: 'Ressources',
    faq: 'FAQ',
    statistiques: 'Statistiques',
    contact: 'Nous contacter',
    'a-propos': "À propos d'Otelo",
    'mentions-legales': 'Mentions légales',
    'donnees-personnelles': 'Données personnelles',
    'retours-d-experience': "Retours d'expériences",
    cgv: 'Conditions générales d’utilisation et Gestion des cookies',
  }

  // Check if the pathname matches any of our breadcrumb paths
  const matchingPath = Object.keys(labelsMap).find((path) => pathname?.includes(path))

  return matchingPath ? (
    <div className={fr.cx('fr-container')}>
      <Breadcrumb
        currentPageLabel={labelsMap[matchingPath]}
        homeLinkProps={{
          href: '/accueil',
        }}
        segments={[]}
      />
    </div>
  ) : null
}
