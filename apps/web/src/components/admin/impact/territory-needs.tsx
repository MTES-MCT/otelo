'use client'

import Tabs from '@codegouvfr/react-dsfr/Tabs'
import { NEED_COMPONENT_LABELS, type TImpactStatistics, type TTerritoryNeeds } from '@shared'
import classNames from 'classnames'
import { type FC, useState } from 'react'
import { Bar, BarChart, CartesianGrid, Cell, ComposedChart, Legend, Line, LineChart, ReferenceLine, Tooltip, XAxis, YAxis } from 'recharts'
import styles from '~/app/(authenticated)/admin/admin.module.css'
import { ADMIN_CARD, ADMIN_CARD_HEADER } from '~/components/admin/shared/admin-classes'
import { ADMIN_CHART_GRID, chartColor } from '~/components/admin/shared/admin-colors'
import { ChartCard } from '~/components/admin/shared/chart-card'
import { StatCard } from '~/components/admin/shared/stat-card'
import { formatNumber } from '~/utils/date-helpers'

type TerritoryNeedsProps = {
  territoryNeeds?: TImpactStatistics['impact']['territoryNeeds']
  isLoading?: boolean
}

type Scope = 'exported' | 'all'

const SCOPE_HINTS: Record<Scope, string> = {
  exported:
    "EPCI ayant fait l'objet d'une demande de PowerPoint : on retient le scénario privilégié de chaque demande, moyenné s'il y en a plusieurs.",
  all: 'Tous les EPCI simulés : scénarios privilégiés pour ceux qui ont été exportés, moyenne de toutes leurs simulations pour les autres.',
}

const formatPerYear = (value: number) => `${formatNumber(value)} / an`

const TerritoryNeedsPanel: FC<{ needs?: TTerritoryNeeds; scope: Scope; isLoading?: boolean }> = ({ isLoading, needs, scope }) => {
  const breakdown = (needs?.breakdown ?? []).map((row) => ({ ...row, label: NEED_COMPONENT_LABELS[row.component] }))
  const newConstructionPerYear = breakdown.reduce((sum, row) => sum + row.perYear, 0)
  const badHousingPerYear = breakdown.find((row) => row.component === 'badHousing')?.perYear ?? 0
  const share = (value: number) =>
    newConstructionPerYear === 0 ? '—' : `${Math.round((value / newConstructionPerYear) * 100).toLocaleString('fr-FR')} %`

  return (
    <>
      <p className="fr-text--sm fr-text-mention--grey">
        {SCOPE_HINTS[scope]} Tous scénarios depuis le lancement : le sélecteur de période ne s'applique pas ici.
      </p>

      <div className={classNames('fr-mb-3w', styles.statsGrid)}>
        <StatCard accent="blue" icon="fr-icon-map-pin-2-line" isLoading={isLoading} label="Territoires" value={needs?.territories ?? 0} />
        <StatCard
          accent="green"
          hint="Scénarios retenus par la règle d'agrégation"
          icon="fr-icon-file-text-line"
          isLoading={isLoading}
          label="Scénarios"
          value={needs?.scenarios ?? 0}
        />
        <StatCard
          accent="purple"
          hint="Somme des territoires, annualisée sur la période de chaque scénario"
          icon="fr-icon-home-4-line"
          isLoading={isLoading}
          label="Constructions neuves"
          value={formatPerYear(newConstructionPerYear)}
        />
        <StatCard
          accent="orange"
          hint={`${share(badHousingPerYear)} des constructions neuves`}
          icon="fr-icon-team-line"
          isLoading={isLoading}
          label="Mal-logement résorbé"
          value={formatPerYear(badHousingPerYear)}
        />
      </div>

      <div className={classNames('fr-mb-3w', styles.grid2)}>
        <ChartCard
          hint="Série annuelle du moteur, sommée sur les territoires. Les horizons diffèrent : la courbe indique combien de territoires couvrent chaque année."
          isEmpty={!needs?.byYear.length}
          isLoading={isLoading}
          tall
          title="Constructions neuves par année"
        >
          <ComposedChart data={needs?.byYear ?? []}>
            <CartesianGrid stroke={ADMIN_CHART_GRID} strokeDasharray="3 3" />
            <XAxis dataKey="year" fontSize={11} />
            <YAxis fontSize={11} tickFormatter={formatNumber} width="auto" yAxisId="needs" />
            <YAxis allowDecimals={false} fontSize={11} orientation="right" width="auto" yAxisId="territories" />
            <Tooltip formatter={(value) => formatNumber(Number(value))} />
            <Legend />
            <Bar dataKey="newConstruction" fill={chartColor(0)} name="Constructions neuves" radius={[4, 4, 0, 0]} yAxisId="needs" />
            <Line
              dataKey="territories"
              dot={false}
              name="Territoires couverts"
              stroke={chartColor(2)}
              strokeWidth={2}
              type="stepAfter"
              yAxisId="territories"
            />
          </ComposedChart>
        </ChartCard>

        <ChartCard
          hint="Totaux du scénario divisés par sa durée (jusqu'à l'horizon ou au pic), puis sommés sur les territoires."
          isEmpty={!needs?.byYear.length}
          isLoading={isLoading}
          tall
          title="Besoins annualisés par année"
        >
          <LineChart data={needs?.byYear ?? []}>
            <CartesianGrid stroke={ADMIN_CHART_GRID} strokeDasharray="3 3" />
            <XAxis dataKey="year" fontSize={11} />
            <YAxis fontSize={11} tickFormatter={formatNumber} width="auto" />
            <ReferenceLine stroke="var(--border-plain-grey)" y={0} />
            <Tooltip formatter={(value) => formatNumber(Number(value))} />
            <Legend />
            <Line dataKey="vacancyRemobilised" dot={false} name="Vacants remobilisés" stroke={chartColor(1)} strokeWidth={2} />
            <Line
              dataKey="secondaryRemobilised"
              dot={false}
              name="Résidences secondaires remobilisées"
              stroke={chartColor(3)}
              strokeWidth={2}
            />
            <Line dataKey="renewal" dot={false} name="Renouvellement urbain" stroke={chartColor(4)} strokeWidth={2} />
            <Line dataKey="badHousing" dot={false} name="Mal-logement" stroke={chartColor(6)} strokeWidth={2} />
          </LineChart>
        </ChartCard>
      </div>

      <div className={classNames('fr-mb-3w', styles.grid2)}>
        <ChartCard
          hint="Besoins annuels par terme, toutes années confondues. Les termes négatifs sont fournis par le parc existant."
          isEmpty={!needs?.territories}
          isLoading={isLoading}
          title="Répartition des besoins par type"
        >
          <BarChart data={breakdown} layout="vertical" margin={{ left: 24 }}>
            <CartesianGrid stroke={ADMIN_CHART_GRID} strokeDasharray="3 3" />
            <XAxis fontSize={11} tickFormatter={formatNumber} type="number" />
            <YAxis dataKey="label" fontSize={11} type="category" width={190} />
            <ReferenceLine stroke="var(--border-plain-grey)" x={0} />
            <Tooltip formatter={(value) => [`${formatPerYear(Number(value))} (${share(Number(value))})`, 'Besoin']} />
            <Bar dataKey="perYear" name="Besoin" radius={[0, 4, 4, 0]}>
              {breakdown.map((row, index) => (
                <Cell fill={chartColor(index)} key={row.component} />
              ))}
            </Bar>
          </BarChart>
        </ChartCard>

        <div className={ADMIN_CARD}>
          <div className={ADMIN_CARD_HEADER}>
            <div>
              <h3 className={classNames('fr-m-0', styles.cardTitle)}>Constructions neuves par région</h3>
              <p className="fr-text--xs fr-text-mention--grey fr-mb-0 fr-mt-1v">Besoins annualisés, sommés sur les territoires.</p>
            </div>
          </div>
          {needs?.byRegion.length ? (
            <div className={classNames('fr-table fr-m-0', styles.tableWrapper)}>
              <table className="fr-width-full">
                <thead>
                  <tr>
                    <th scope="col">Région</th>
                    <th scope="col">Territoires</th>
                    <th scope="col">Constructions neuves</th>
                  </tr>
                </thead>
                <tbody>
                  {needs.byRegion.map((row) => (
                    <tr key={row.label}>
                      <td>{row.label}</td>
                      <td>{formatNumber(row.territories)}</td>
                      <td>{formatPerYear(row.newConstructionPerYear)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="fr-p-3w fr-text--sm fr-text-mention--grey fr-mb-0">Aucun territoire.</p>
          )}
        </div>
      </div>
    </>
  )
}

export const TerritoryNeeds: FC<TerritoryNeedsProps> = ({ isLoading, territoryNeeds }) => {
  const [scope, setScope] = useState<Scope>('exported')

  return (
    <>
      <h3 className="fr-h6 fr-mt-4w">Besoins en logements portés par les territoires</h3>
      <Tabs
        onTabChange={(tabId) => setScope(tabId as Scope)}
        selectedTabId={scope}
        tabs={[
          { label: 'Territoires ayant demandé un export', tabId: 'exported' },
          { label: 'Tous scénarios confondus', tabId: 'all' },
        ]}
      >
        <TerritoryNeedsPanel isLoading={isLoading} needs={territoryNeeds?.[scope]} scope={scope} />
      </Tabs>
    </>
  )
}
