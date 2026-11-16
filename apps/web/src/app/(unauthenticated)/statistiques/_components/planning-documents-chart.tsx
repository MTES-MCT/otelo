'use client'

import { Table } from '@codegouvfr/react-dsfr/Table'
import type { TPublicStatistics } from '@otelo/shared'
import { Bar, BarChart, CartesianGrid, LabelList, ResponsiveContainer, XAxis, YAxis } from 'recharts'
import { formatInteger } from '~/utils/format-statistics'
import styles from '../statistiques.module.css'
import { PLANNING_DOCUMENT_LABELS } from './format'

/** Dimension utilisée au rendu serveur, avant la mesure du conteneur. */
const CHART_HEIGHT = 280

export function PlanningDocumentsChart({ byType }: { byType: TPublicStatistics['planningDocumentsByType'] }) {
  const data = byType.map((row) => ({ label: PLANNING_DOCUMENT_LABELS[row.key], count: row.count }))

  return (
    <figure className={styles.chartFigure}>
      <figcaption className={styles.chartCaption}>
        Dossiers d'études déclarant un document d'urbanisme, avec au moins un scénario exporté, par type de document
      </figcaption>
      <div className={styles.chartSmall} aria-hidden="true">
        <ResponsiveContainer width="100%" height="100%" initialDimension={{ width: 800, height: CHART_HEIGHT }}>
          <BarChart data={data} margin={{ top: 25, right: 10, bottom: 5, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="label" tick={{ fontSize: 12 }} />
            <YAxis allowDecimals={false} width="auto" tickFormatter={formatInteger} tick={{ fontSize: 12 }} />
            <Bar dataKey="count" name="Dossiers d'études" fill="#000091">
              <LabelList dataKey="count" position="top" formatter={(value) => formatInteger(Number(value))} />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <details className={styles.disclosure}>
        <summary className="fr-link">Transcription du graphique : documents d'urbanisme par type</summary>
        <Table
          className="fr-mt-2w"
          caption="Dossiers d'études par type de document d'urbanisme"
          headers={['Type de document', "Dossiers d'études"]}
          data={data.map((row) => [row.label, formatInteger(row.count)])}
          bordered
        />
      </details>
    </figure>
  )
}
