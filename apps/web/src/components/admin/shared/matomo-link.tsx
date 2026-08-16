'use client'

import Button from '@codegouvfr/react-dsfr/Button'
import type { FC } from 'react'
import type { PeriodRange } from './period-selector'

/**
 * Rapports Matomo utiles, avec leur module et action.
 * `category` cible directement une catégorie du plan de tracking (cf. `lib/TRACKING.md`).
 */
export const MATOMO_REPORTS = {
  events: { category: 'General_Actions', subcategory: 'Events_Events' },
  pages: { category: 'General_Actions', subcategory: 'General_Pages' },
  referrers: { category: 'Referrers_Referrers', subcategory: 'Referrers_WidgetGetAll' },
  siteSearch: { category: 'General_Actions', subcategory: 'Actions_SubmenuSitesearch' },
  visitsSummary: { category: 'General_Visitors', subcategory: 'General_Overview' },
} as const

export type MatomoReport = keyof typeof MATOMO_REPORTS

type MatomoLinkProps = {
  report: MatomoReport
  range: PeriodRange
  label: string
}

/**
 * Ouvre un rapport Matomo sur la période affichée.
 *
 * Choix assumé : aucune synchronisation de l'API Matomo vers la base. Les chiffres
 * officiels viennent de la base ; Matomo reste consulté dans Matomo, avec sa propre
 * interface d'export. Cela évite une table de plus à maintenir et à resynchroniser.
 *
 * Le bouton n'apparaît pas si `NEXT_PUBLIC_MATOMO_URL` n'est pas configurée.
 */
export const MatomoLink: FC<MatomoLinkProps> = ({ label, range, report }) => {
  const matomoUrl = process.env.NEXT_PUBLIC_MATOMO_URL
  const siteId = process.env.NEXT_PUBLIC_MATOMO_SITE_ID

  if (!matomoUrl || !siteId) {
    return null
  }

  const { category, subcategory } = MATOMO_REPORTS[report]
  const href = `${matomoUrl.replace(/\/+$/, '')}/index.php?module=CoreHome&action=index&idSite=${siteId}&period=range&date=${range.from},${range.to}#?idSite=${siteId}&period=range&date=${range.from},${range.to}&category=${category}&subcategory=${subcategory}`

  return (
    <Button
      iconId="fr-icon-external-link-line"
      iconPosition="right"
      linkProps={{ href, rel: 'noopener noreferrer', target: '_blank' }}
      priority="tertiary"
      size="small"
    >
      {label}
    </Button>
  )
}
