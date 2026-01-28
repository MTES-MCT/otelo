import { FC } from 'react'
import { PopulationEvolutionChartProps } from '~/components/charts/data-visualisation/population-evolution-charts'
import { formatNumber } from '~/utils/format-numbers'
import styles from './population-evolution-table.module.css'

export const PopulationEvolutionTable: FC<PopulationEvolutionChartProps> = ({ data, type }) => {
  const { tableData } = data
  const dataTable = Object.entries(tableData).map((row) => {
    const rowValue = row[1]
    return {
      [rowValue.name]: {
        '2010': rowValue[2010].value,
        '2015': rowValue[2015].value,
        '2021': rowValue[2021].value,
        annualEvolution: rowValue.annualEvolution,
      },
    }
  })
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
            <th colSpan={3} className={styles.headerCell}>
              {title}
            </th>
            <th colSpan={2} className={styles.headerCell}>
              Evolution annuelle moyenne en volume
            </th>
            <th colSpan={2} className={styles.headerCell}>
              Evolution annuelle moyenne en %
            </th>
          </tr>
          <tr>
            <th className={styles.headerCell}>2010</th>
            <th className={styles.headerCell}>2015</th>
            <th className={styles.headerCell}>2021</th>
            <th className={styles.headerCell}>2010 - 2015</th>
            <th className={styles.headerCell}>2015 - 2021</th>
            <th className={styles.headerCell}>2010 - 2015</th>
            <th className={styles.headerCell}>2015 - 2021</th>
          </tr>
        </thead>
        <tbody>
          {Object.entries(dataTable).map(([key, value]) => {
            const territoryName = Object.keys(value)[0]
            const territoryData = Object.values(value)[0]
            return (
              <tr key={key}>
                <td className={styles.cell}>{territoryName}</td>
                <td className={styles.cellMinWidth}>{formatNumber(territoryData['2010'])}</td>
                <td className={styles.cellMinWidth}>{formatNumber(territoryData['2015'])}</td>
                <td className={styles.cellMinWidth}>{formatNumber(territoryData['2021'])}</td>
                <td className={styles.cellMinWidth}>{formatNumber(territoryData.annualEvolution['2010-2015'].value) || '-'}</td>
                <td className={styles.cellMinWidth}>{formatNumber(territoryData.annualEvolution['2015-2021'].value) || '-'}</td>
                <td className={styles.cellMinWidth}>{territoryData.annualEvolution['2010-2015'].percent || '-'}</td>
                <td className={styles.cellMinWidth}>{territoryData.annualEvolution['2015-2021'].percent || '-'}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
