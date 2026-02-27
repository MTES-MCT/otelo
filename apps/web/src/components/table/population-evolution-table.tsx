import { FC } from 'react'
import { PopulationEvolutionChartProps } from '~/components/charts/data-visualisation/population-evolution-charts'
import { TRPDataTable } from '~/schemas/population-evolution'
import { formatNumber } from '~/utils/format-numbers'
import styles from './population-evolution-table.module.css'

type EvolutionEntry = { value: number; percent: string }

const getYearKeys = (tableData: TRPDataTable): string[] => {
  const firstRow = Object.values(tableData)[0]
  if (!firstRow) return ['2010', '2015', '2021']
  return Object.keys(firstRow)
    .filter((k) => /^\d{4}$/.test(k))
    .sort()
}

export const PopulationEvolutionTable: FC<PopulationEvolutionChartProps> = ({ data, type }) => {
  const { tableData } = data
  const yearKeys = getYearKeys(tableData)
  const dataTable = Object.entries(tableData).map(([, rowValue]) => {
    const rv = rowValue as unknown as { name: string; annualEvolution: Record<string, EvolutionEntry> }
    const yearEntries = rowValue as unknown as Record<string, { value: number }>
    const yearData: Record<string, number> = {}
    yearKeys.forEach((y) => {
      yearData[y] = yearEntries[y]?.value
    })
    return {
      [rv.name]: {
        yearData,
        annualEvolution: rv.annualEvolution,
      },
    }
  })

  const periods = yearKeys.slice(0, -1).map((y, i) => `${y}-${yearKeys[i + 1]}`)

  const title = type === 'population-evolution' ? 'Population' : 'Menage'
  const tableTitle =
    type === 'population-evolution'
      ? "Tableau : Evolution du nombre d'habitants sur le bassin d'habitat, par moyenne annuelle (en volume et en pourcentage)"
      : "Tableau : Evolution du nombre de ménages sur le bassin d'habitat, par moyenne annuelle (en volume et en pourcentage)"

  return (
    <div className="fr-pt-6w">
      <h2 className={styles.title}>{tableTitle}</h2>
      <table className={styles.table}>
        <thead>
          <tr>
            <th rowSpan={2} className={styles.headerCellSpan}>
              BH/EPCI
            </th>
            <th colSpan={yearKeys.length} className={styles.headerCell}>
              {title}
            </th>
            <th colSpan={periods.length} className={styles.headerCell}>
              Evolution annuelle moyenne en volume
            </th>
            <th colSpan={periods.length} className={styles.headerCell}>
              Evolution annuelle moyenne en %
            </th>
          </tr>
          <tr>
            {yearKeys.map((y) => (
              <th key={`year-${y}`} className={styles.headerCell}>
                {y}
              </th>
            ))}
            {periods.map((p) => (
              <th key={`evol-vol-${p}`} className={styles.headerCell}>
                {p.replace('-', ' - ')}
              </th>
            ))}
            {periods.map((p) => (
              <th key={`evol-pct-${p}`} className={styles.headerCell}>
                {p.replace('-', ' - ')}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Object.entries(dataTable).map(([key, value]) => {
            const territoryName = Object.keys(value)[0]
            const territoryData = Object.values(value)[0]
            return (
              <tr key={key}>
                <td className={styles.cell}>{territoryName}</td>
                {yearKeys.map((y) => (
                  <td key={`val-${y}`} className={styles.cellMinWidth}>
                    {formatNumber(territoryData.yearData[y])}
                  </td>
                ))}
                {periods.map((p) => (
                  <td key={`evol-vol-${p}`} className={styles.cellMinWidth}>
                    {formatNumber(territoryData.annualEvolution[p]?.value) || '-'}
                  </td>
                ))}
                {periods.map((p) => (
                  <td key={`evol-pct-${p}`} className={styles.cellMinWidth}>
                    {territoryData.annualEvolution[p]?.percent || '-'}
                  </td>
                ))}
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
