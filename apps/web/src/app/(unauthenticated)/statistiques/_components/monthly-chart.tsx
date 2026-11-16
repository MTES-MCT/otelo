'use client'

import { Table } from '@codegouvfr/react-dsfr/Table'
import type { TPublicStatistics } from '@otelo/shared'
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { formatInteger, formatMonth, plural } from '~/utils/format-statistics'
import styles from '../statistiques.module.css'

/** Dimension utilisée au rendu serveur, avant la mesure du conteneur. */
const CHART_HEIGHT = 360

const SERIES = [
  { dataKey: 'simulations', name: 'Simulations créées', color: '#000091' },
  { dataKey: 'exports', name: "Demandes d'export PowerPoint", color: '#7373FF' },
] as const

export function MonthlyChart({ monthly }: { monthly: TPublicStatistics['monthly'] }) {
  const data = monthly.map((row) => ({ ...row, label: formatMonth(row.month, true) }))
  const totalSimulations = monthly.reduce((sum, row) => sum + row.simulations, 0)
  const totalExports = monthly.reduce((sum, row) => sum + row.exports, 0)
  const first = monthly.at(0)
  const last = monthly.at(-1)

  return (
    <figure className={styles.chartFigure}>
      <figcaption className={styles.chartCaption}>
        {first && last
          ? `Simulations et demandes d'export par mois, de ${formatMonth(first.month)} à ${formatMonth(last.month)}`
          : "Simulations et demandes d'export par mois"}
      </figcaption>
      <p>
        Sur la période, {formatInteger(totalSimulations)} {plural(totalSimulations, 'simulation a été créée', 'simulations ont été créées')}{' '}
        et {formatInteger(totalExports)}{' '}
        {plural(totalExports, "demande d'export PowerPoint envoyée", "demandes d'export PowerPoint envoyées")}.
      </p>
      <div className={styles.chart} aria-hidden="true">
        <ResponsiveContainer width="100%" height="100%" initialDimension={{ width: 800, height: CHART_HEIGHT }}>
          <BarChart data={data} margin={{ top: 10, right: 10, bottom: 5, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="label" tick={{ fontSize: 12 }} interval="preserveStartEnd" />
            <YAxis allowDecimals={false} width="auto" tickFormatter={formatInteger} tick={{ fontSize: 12 }} />
            <Tooltip formatter={(value) => formatInteger(Number(value))} />
            <Legend />
            {SERIES.map((serie) => (
              <Bar key={serie.dataKey} dataKey={serie.dataKey} name={serie.name} fill={serie.color} />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>
      <details className={styles.disclosure}>
        <summary className="fr-link">Transcription du graphique : évolution mensuelle</summary>
        <Table
          className="fr-mt-2w"
          caption="Simulations, demandes d'export et EPCI actifs par mois"
          headers={['Mois', 'Simulations créées', "Demandes d'export PowerPoint", 'EPCI concernés par une simulation']}
          data={monthly.map((row) => [
            formatMonth(row.month),
            formatInteger(row.simulations),
            formatInteger(row.exports),
            formatInteger(row.activeEpcis),
          ])}
          bordered
        />
      </details>
    </figure>
  )
}
