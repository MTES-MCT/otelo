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
  /** Route hors de la coquille d'administration (ex. /pilotage, ouvert aussi aux DREAL). */
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
      { label: 'Consommateurs API', icon: 'fr-icon-key-line', href: '/admin/consommateurs' },
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
    <aside className={styles.sidebar}>
      <nav className={styles.sidebarNav} aria-label="Navigation de l'administration">
        {NAV_SECTIONS.map((section) => (
          <div key={section.title}>
            <div className={styles.navSectionTitle}>{section.title}</div>
            {section.items.map((item) => {
              const active = isActive(item.href)
              const badge = getBadge(item.badgeKey)

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? 'page' : undefined}
                  className={classNames('fr-link--no-underline', active ? styles.navItemActive : styles.navItem)}
                >
                  <span className={item.icon} aria-hidden="true" />
                  {item.label}
                  {item.external && <span className="fr-icon-external-link-line fr-icon--sm" aria-hidden="true" />}
                  {badge !== null && <span className={styles.navBadge}>{badge.toLocaleString('fr-FR')}</span>}
                </Link>
              )
            })}
          </div>
        ))}
      </nav>
      <div className={styles.sidebarFooter}>
        <div className="fr-text--bold">Otelo</div>
        <div>Administration</div>
      </div>
    </aside>
  )
}
