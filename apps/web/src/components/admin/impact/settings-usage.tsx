'use client'

import { TARGET_REDUCTION_LABELS, type TImpactStatistics } from '@shared'
import classNames from 'classnames'
import type { FC } from 'react'
import { Bar, BarChart, CartesianGrid, Cell, ReferenceLine, Tooltip, XAxis, YAxis } from 'recharts'
import styles from '~/app/(authenticated)/admin/admin.module.css'
import { ADMIN_CARD, ADMIN_CARD_HEADER } from '~/components/admin/shared/admin-classes'
import { ADMIN_CHART_GRID, chartColor } from '~/components/admin/shared/admin-colors'
import { ChartCard } from '~/components/admin/shared/chart-card'
import { StatCard } from '~/components/admin/shared/stat-card'
import { formatNumber } from '~/utils/date-helpers'
import { getOmphaleLabel } from '~/utils/omphale-label'

type SettingsUsageProps = {
  settings?: TImpactStatistics['settings']
  isLoading?: boolean
}

function share(part: number, total: number): string {
  return total === 0 ? '—' : `${Math.round((part / total) * 100)} %`
}

function formatReduction(value: number | null): string {
  return value === null ? '—' : `${value.toLocaleString('fr-FR', { maximumFractionDigits: 1 })} %`
}

const SOURCE_LABELS: Record<string, string> = {
  Filo: 'Filocom',
  RP: 'Recensement (RP)',
  SNE: 'SNE',
  FF: 'Fichiers fonciers',
}

export const SettingsUsage: FC<SettingsUsageProps> = ({ isLoading, settings }) => {
  const scenarios = settings?.scenarios ?? 0
  const omphale = (settings?.byOmphale ?? []).map((row) => ({
    label: getOmphaleLabel(`${row.population}_${row.decohabitation}`) ?? `${row.population}_${row.decohabitation}`,
    count: row.count,
  }))
  const reductions = (settings?.targetReductions ?? []).map((row) => ({ ...row, label: TARGET_REDUCTION_LABELS[row.domain] }))

  return (
    <>
      <h2 className="fr-h5">Paramétrage des scénarios</h2>
      <p className="fr-text--sm fr-text-mention--grey">
        Scénarios créés sur la période : comment les utilisateurs construisent leurs hypothèses.
      </p>

      <div className={classNames('fr-mb-3w', styles.statsGrid)}>
        <StatCard accent="blue" icon="fr-icon-settings-5-line" isLoading={isLoading} label="Scénarios créés" value={scenarios} />
        <StatCard
          accent="green"
          hint={`${share(settings?.depth.modifiedSimulations ?? 0, scenarios)} des scénarios · ${formatNumber(settings?.depth.avgModificationsPerSimulation)} modification(s) en moyenne`}
          icon="fr-icon-refresh-line"
          isLoading={isLoading}
          label="Scénarios retravaillés"
          value={settings?.depth.modifiedSimulations ?? 0}
        />
        <StatCard
          accent="purple"
          hint={`${share(settings?.customizedBadHousing ?? 0, scenarios)} des scénarios s'écartent des valeurs par défaut`}
          icon="fr-icon-home-4-line"
          isLoading={isLoading}
          label="Mal-logement ajusté"
          value={settings?.customizedBadHousing ?? 0}
        />
        <StatCard
          accent="orange"
          hint={`${settings?.customProjections.users ?? 0} utilisateur(s) ont importé leur propre projection`}
          icon="fr-icon-upload-line"
          isLoading={isLoading}
          label="Projections à façon"
          value={settings?.customProjections.scenarios ?? 0}
        />
      </div>

      <div className={classNames('fr-mb-3w', styles.grid2)}>
        <ChartCard
          hint="Hypothèse de population et de décohabitation retenue"
          isEmpty={!omphale.length}
          isLoading={isLoading}
          title="Scénario démographique"
        >
          <BarChart data={omphale} layout="vertical" margin={{ left: 24 }}>
            <CartesianGrid stroke={ADMIN_CHART_GRID} strokeDasharray="3 3" />
            <XAxis allowDecimals={false} fontSize={11} type="number" />
            <YAxis dataKey="label" fontSize={11} type="category" width={140} />
            <Tooltip />
            <Bar dataKey="count" fill={chartColor(0)} name="Scénarios" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ChartCard>

        <ChartCard
          hint="Année d'horizon de la projection"
          isEmpty={!settings?.byHorizon.length}
          isLoading={isLoading}
          title="Horizon de projection"
        >
          <BarChart data={settings?.byHorizon ?? []}>
            <CartesianGrid stroke={ADMIN_CHART_GRID} strokeDasharray="3 3" />
            <XAxis dataKey="label" fontSize={11} />
            <YAxis allowDecimals={false} fontSize={11} />
            <Tooltip />
            <Bar dataKey="count" fill={chartColor(1)} name="Scénarios" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ChartCard>
      </div>

      <div className={classNames('fr-mb-3w', styles.grid2)}>
        <ChartCard
          hint="Réduction moyenne du taux cible par rapport au taux observé. Une valeur négative traduit un objectif de hausse."
          isEmpty={!reductions.some((row) => row.scenarios > 0)}
          isLoading={isLoading}
          title="Réductions retenues sur les taux cibles"
        >
          <BarChart data={reductions}>
            <CartesianGrid stroke={ADMIN_CHART_GRID} strokeDasharray="3 3" />
            <XAxis dataKey="label" fontSize={11} interval={0} />
            <YAxis fontSize={11} tickFormatter={(value) => `${value} %`} />
            <ReferenceLine stroke="var(--border-plain-grey)" y={0} />
            <Tooltip
              content={({ active, payload }) => {
                const row = payload?.[0]?.payload as (typeof reductions)[number] | undefined
                if (!active || !row) return null

                return (
                  <div className="fr-p-2v fr-border fr-background-default--grey fr-text--xs">
                    <strong>{row.label}</strong>
                    <div>Moyenne : {formatReduction(row.average)}</div>
                    <div>Médiane : {formatReduction(row.median)}</div>
                    <div>{formatNumber(row.scenarios)} scénario(s)</div>
                  </div>
                )
              }}
            />
            <Bar dataKey="average" name="Réduction moyenne" radius={[4, 4, 0, 0]}>
              {reductions.map((row, index) => (
                <Cell fill={chartColor(index)} key={row.domain} />
              ))}
            </Bar>
          </BarChart>
        </ChartCard>

        <div className={ADMIN_CARD}>
          <div className={ADMIN_CARD_HEADER}>
            <div>
              <h3 className={classNames('fr-m-0', styles.cardTitle)}>Construction des dossiers</h3>
              <p className="fr-text--xs fr-text-mention--grey fr-mb-0 fr-mt-1v">
                Dossiers d'études contenant un scénario créé sur la période.
              </p>
            </div>
          </div>
          <div className={classNames('fr-table fr-m-0', styles.tableWrapper)}>
            <table className="fr-width-full">
              <thead>
                <tr>
                  <th scope="col">Indicateur</th>
                  <th scope="col">Valeur</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Dossiers d'études</td>
                  <td>{formatNumber(settings?.depth.dossiers)}</td>
                </tr>
                <tr>
                  <td>Scénarios par dossier (moyenne)</td>
                  <td>{formatNumber(settings?.depth.avgSimulationsPerDossier)}</td>
                </tr>
                <tr>
                  <td>Dossiers comparant plusieurs scénarios</td>
                  <td>
                    {formatNumber(settings?.depth.dossiersWithSeveralSimulations)}{' '}
                    <span className="fr-text--xs fr-text-mention--grey">
                      ({share(settings?.depth.dossiersWithSeveralSimulations ?? 0, settings?.depth.dossiers ?? 0)})
                    </span>
                  </td>
                </tr>
                <tr>
                  <td>Scénarios dupliqués</td>
                  <td>{formatNumber(settings?.depth.clones)}</td>
                </tr>
                <tr>
                  <td>Actualisations sur un nouveau millésime</td>
                  <td>{formatNumber(settings?.depth.actualizations)}</td>
                </tr>
                <tr>
                  <td>Millésimes de données</td>
                  <td>{settings?.byMillesime.map((row) => `${row.label} : ${formatNumber(row.count)}`).join(' · ') || '—'}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className={classNames('fr-mb-3w', ADMIN_CARD)}>
        <div className={ADMIN_CARD_HEADER}>
          <div>
            <h3 className={classNames('fr-m-0', styles.cardTitle)}>Sources retenues pour le mal-logement</h3>
            <p className="fr-text--xs fr-text-mention--grey fr-mb-0 fr-mt-1v">
              Source de données retenue pour chaque besoin, parmi les scénarios créés sur la période.
            </p>
          </div>
        </div>
        {settings?.badHousingSources.length ? (
          <div className={classNames('fr-table fr-m-0', styles.tableWrapper)}>
            <table className="fr-width-full">
              <thead>
                <tr>
                  <th scope="col">Besoin</th>
                  <th scope="col">Source</th>
                  <th scope="col">Scénarios</th>
                </tr>
              </thead>
              <tbody>
                {settings.badHousingSources.map((row) => (
                  <tr key={`${row.parameter}-${row.value}`}>
                    <td>{row.parameter}</td>
                    <td>{SOURCE_LABELS[row.value] ?? row.value}</td>
                    <td>
                      {formatNumber(row.count)} <span className="fr-text--xs fr-text-mention--grey">({share(row.count, scenarios)})</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="fr-p-3w fr-text--sm fr-text-mention--grey fr-mb-0">Aucun scénario créé sur cette période.</p>
        )}
      </div>
    </>
  )
}
