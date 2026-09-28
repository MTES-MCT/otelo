'use client'

import type { TImpactStatistics } from '@shared'
import classNames from 'classnames'
import type { FC } from 'react'
import { Bar, BarChart, CartesianGrid, Tooltip, XAxis, YAxis } from 'recharts'
import styles from '~/app/(authenticated)/admin/admin.module.css'
import { ADMIN_CARD } from '~/components/admin/shared/admin-classes'
import { ADMIN_CHART_GRID, chartColor } from '~/components/admin/shared/admin-colors'
import { ChartCard } from '~/components/admin/shared/chart-card'
import { MatomoLink } from '~/components/admin/shared/matomo-link'
import type { PeriodRange } from '~/components/admin/shared/period-selector'
import { StatCard } from '~/components/admin/shared/stat-card'

type PerceivedUtilityProps = {
  perceivedUtility?: TImpactStatistics['perceivedUtility']
  range: PeriodRange
  isLoading?: boolean
}

export const PerceivedUtility: FC<PerceivedUtilityProps> = ({ isLoading, perceivedUtility, range }) => (
  <>
    <h2 className="fr-h5 fr-mt-4w">Utilité perçue</h2>
    <p className="fr-text--sm fr-text-mention--grey">Avis déposés sur la période via la fenêtre de retour.</p>

    <div className={classNames('fr-mb-3w', styles.statsGrid)}>
      <StatCard
        accent="blue"
        hint="Note sur 5"
        icon="fr-icon-star-line"
        isLoading={isLoading}
        label="Note moyenne"
        value={perceivedUtility?.averageRating == null ? '—' : perceivedUtility.averageRating.toLocaleString('fr-FR')}
      />
      <StatCard
        accent="green"
        icon="fr-icon-questionnaire-line"
        isLoading={isLoading}
        label="Avis reçus"
        value={perceivedUtility?.responses ?? 0}
      />
      <StatCard
        accent="purple"
        icon="fr-icon-chat-3-line"
        isLoading={isLoading}
        label="Avis commentés"
        value={perceivedUtility?.withComment ?? 0}
      />
      <StatCard
        accent="orange"
        hint="Sollicités, mais ont préféré répondre plus tard"
        icon="fr-icon-time-line"
        isLoading={isLoading}
        label="Réponses reportées"
        value={perceivedUtility?.snoozed ?? 0}
      />
    </div>

    <div className={classNames('fr-mb-3w', styles.grid2)}>
      <ChartCard isEmpty={!perceivedUtility?.responses} isLoading={isLoading} title="Répartition des notes">
        <BarChart data={perceivedUtility?.distribution ?? []}>
          <CartesianGrid stroke={ADMIN_CHART_GRID} strokeDasharray="3 3" />
          <XAxis dataKey="rating" fontSize={11} tickFormatter={(value) => `${value} / 5`} />
          <YAxis allowDecimals={false} fontSize={11} />
          <Tooltip labelFormatter={(value) => `${value} / 5`} />
          <Bar dataKey="count" fill={chartColor(0)} name="Avis" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ChartCard>

      <div className={ADMIN_CARD}>
        <div className="fr-p-3w">
          <p className="fr-text--sm">
            Les signalements de problème et les abandons de tutoriel ne sont pas enregistrés en base : ils sont mesurés dans Matomo
            (catégories « Engagement » et « Aide »).
          </p>
          <div className="fr-flex fr-flex-wrap fr-flex-gap-2v">
            <MatomoLink label="Événements" range={range} report="events" />
          </div>
        </div>
      </div>
    </div>
  </>
)
