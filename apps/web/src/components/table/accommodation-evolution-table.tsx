import { FC } from 'react'
import { TAccommodationEvolutionDataTable } from '~/schemas/accommodation-evolution'
import { formatNumber } from '~/utils/format-numbers'
import styles from './population-evolution-table.module.css'

interface AccommodationEvolutionTableProps {
  data: TAccommodationEvolutionDataTable
  type: 'secondaryAccommodation' | 'vacant'
}

type YearEntry = { value: number; percent: string }
type EvolutionEntry = { value: number; percent: string; percentPoint: string }

const getYearKeys = (data: TAccommodationEvolutionDataTable): string[] => {
  const firstRow = Object.values(data)[0]
  if (!firstRow) return ['2010', '2015', '2021']
  return Object.keys(firstRow)
    .filter((k) => /^\d{4}$/.test(k))
    .sort()
}

export const AccommodationEvolutionTable: FC<AccommodationEvolutionTableProps> = ({ data, type }) => {
  const yearKeys = getYearKeys(data)
  const dataTable = Object.entries(data).map(([, rowValue]) => {
    const rv = rowValue as unknown as { name: string; annualEvolution: Record<string, EvolutionEntry> }
    const yearEntries = rowValue as unknown as Record<string, YearEntry>
    const yearData: Record<string, YearEntry> = {}
    yearKeys.forEach((y) => {
      yearData[y] = { value: yearEntries[y]?.value, percent: yearEntries[y]?.percent }
    })
    return {
      [rv.name]: {
        yearData,
        annualEvolution: rv.annualEvolution,
      },
    }
  })

  const periods = yearKeys.slice(0, -1).map((y, i) => `${y}-${yearKeys[i + 1]}`)

  const title = type === 'secondaryAccommodation' ? 'Résidences secondaires' : 'Logements vacants'
  const tableTitle =
    type === 'secondaryAccommodation'
      ? "Tableau descriptif et d'analyse des résidences secondaires sur le bassin d'habitat"
      : "Tableau descriptif et d'analyse des logements vacants sur le bassin d'habitat"
  return (
    <div className={styles.container}>
      <h2 className={styles.title}>{tableTitle}</h2>
      <table className={styles.table}>
        <thead>
          <tr>
            <th rowSpan={3} className={styles.headerCellSpan}>
              BH/EPCI
            </th>
            <th colSpan={yearKeys.length * 2} className={styles.headerCell}>
              {title}
            </th>
            <th colSpan={periods.length * 3} className={styles.headerCell}>
              Evolution moyenne annuelle
            </th>
          </tr>
          <tr>
            <th colSpan={yearKeys.length} className={styles.headerCell}>
              Volume
            </th>
            <th colSpan={yearKeys.length} className={styles.headerCell}>
              Part
            </th>
            <th colSpan={periods.length} className={styles.headerCell}>
              Volume
            </th>
            <th colSpan={periods.length} className={styles.headerCell}>
              Pourcentage
            </th>
            <th colSpan={periods.length} className={styles.headerCell}>
              point de %
            </th>
          </tr>
          <tr>
            {yearKeys.map((y) => (
              <th key={`vol-${y}`} className={styles.headerCell}>
                {y}
              </th>
            ))}
            {yearKeys.map((y) => (
              <th key={`part-${y}`} className={styles.headerCell}>
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
            {periods.map((p) => (
              <th key={`evol-pp-${p}`} className={styles.headerCell}>
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
                  <td key={`vol-${y}`} className={styles.cellMinWidth}>
                    {formatNumber(territoryData.yearData[y]?.value)}
                  </td>
                ))}
                {yearKeys.map((y) => (
                  <td key={`part-${y}`} className={styles.cellMinWidth}>
                    {territoryData.yearData[y]?.percent}
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
                {periods.map((p) => (
                  <td key={`evol-pp-${p}`} className={styles.cellMinWidth}>
                    {territoryData.annualEvolution[p]?.percentPoint || '-'}
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
