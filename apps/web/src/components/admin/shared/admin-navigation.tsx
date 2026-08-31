'use client'

import classNames from 'classnames'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import type { FC } from 'react'
import styles from '~/app/(authenticated)/admin/admin.module.css'
import { useAdminOverview } from '~/hooks/use-admin-overview'

type BadgeKey = 'users' | 'scenarios' | 'feedbacks'

type NavItem = {
  label: string
  icon: string
  href: string
  badgeKey?: BadgeKey
  external?: boolean
}

type NavSection = {
  title: string
  items: NavItem[]
}

const NAV_SECTIONS: NavSection[] = [
  {
    title: 'Pilotage',
    items: [
      { label: 'Tableau de bord', icon: 'fr-icon-dashboard-3-line', href: '/admin/tableau-de-bord' },
      { label: 'Audience & usage', icon: 'fr-icon-line-chart-line', href: '/admin/audience' },
      { label: 'Statistiques métier', icon: 'fr-icon-bar-chart-box-line', href: '/admin/statistiques' },
      { label: 'Pilotage territorial', icon: 'fr-icon-map-pin-2-line', href: '/pilotage', external: true },
    ],
  },
  {
    title: 'Utilisateurs',
    items: [
      { label: 'Utilisateurs', icon: 'fr-icon-user-line', href: '/admin/utilisateurs', badgeKey: 'users' },
      { label: 'Retours', icon: 'fr-icon-questionnaire-line', href: '/admin/feedbacks', badgeKey: 'feedbacks' },
    ],
  },
  {
    title: 'Système',
    items: [
      { label: 'Journal des modifications', icon: 'fr-icon-article-line', href: '/admin/journal' },
      { label: 'Exports', icon: 'fr-icon-download-line', href: '/admin/exports' },
      { label: 'Consommateurs API', icon: 'fr-icon-lock-line', href: '/admin/consommateurs' },
    ],
  },
]

export const AdminNavigation: FC = () => {
  const pathname = usePathname()
  const { data: overview } = useAdminOverview()

  const getBadge = (key?: BadgeKey): number | null => {
    if (!key || !overview) {
      return null
    }

    return overview[key] ?? null
  }

  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`)

  return (
    <aside
      className={classNames(
        'fr-flex fr-direction-column fr-justify-content-space-between fr-border-right fr-background-default--grey',
        styles.sidebar,
      )}
    >
      <nav className="fr-flex fr-direction-column fr-flex-gap-6v fr-px-3v fr-py-6v" aria-label="Navigation de l'administration">
        {NAV_SECTIONS.map((section) => (
          <div key={section.title}>
            <div className={classNames('fr-px-3v fr-mb-2v fr-text--bold fr-text--uppercase fr-text-mention--grey', styles.navSectionTitle)}>
              {section.title}
            </div>
            {section.items.map((item) => {
              const active = isActive(item.href)
              const badge = getBadge(item.badgeKey)

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? 'page' : undefined}
                  className={classNames(
                    'fr-link--no-underline fr-flex fr-align-items-center fr-flex-gap-2v fr-px-3v fr-py-2v fr-border-radius--4 fr-text--sm fr-mb-2v',
                    active ? classNames('fr-text--medium', styles.navItemActive) : styles.navItem,
                  )}
                >
                  <span className={item.icon} aria-hidden="true" />
                  {item.label}
                  {item.external && <span className="fr-icon-external-link-line fr-icon--sm" aria-hidden="true" />}
                  {badge !== null && (
                    <span
                      className={classNames('fr-ml-auto fr-text--bold fr-text-mention--grey fr-background-contrast--grey', styles.navBadge)}
                    >
                      {badge.toLocaleString('fr-FR')}
                    </span>
                  )}
                </Link>
              )
            })}
          </div>
        ))}
      </nav>
    </aside>
  )
}
