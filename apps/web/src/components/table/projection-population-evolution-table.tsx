import { FC } from 'react'
import {
  TDemographicMaxYearsByEpci,
  TDemographicProjectionDataTable,
  TDemographicProjectionDataTableRow,
} from '~/schemas/population-evolution'
import { formatNumber } from '~/utils/format-numbers'
import styles from './projection-evolution-table.module.css'

type ScenarioKey = 'basse' | 'central' | 'haute'

export type ProjectionPopulationEvolutionTableProps = {
  data: TDemographicProjectionDataTable
  maxYears: TDemographicMaxYearsByEpci
}

export const ProjectionPopulationEvolutionTable: FC<ProjectionPopulationEvolutionTableProps> = ({ data, maxYears }) => {
  const dataTable = Object.entries(data).map(([key, rowValue]) => {
    const typedRowValue = rowValue as unknown as TDemographicProjectionDataTableRow
    return {
      [typedRowValue.name]: {
        '2021': typedRowValue['2021'],
        '2030': typedRowValue['2030'],
        '2040': typedRowValue['2040'],
        '2050': typedRowValue['2050'],
        maxYears: maxYears[key],
        annualEvolution: typedRowValue.annualEvolution,
      },
    }
  })

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>Tableau descriptif et d'analyse des projections de population, sur le bassin d'habitat</h2>

      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th rowSpan={2} className={styles.headerCell}>
                EPCI/BH
              </th>
              <th rowSpan={2} className={styles.headerCell}>
                Scénarios
              </th>
              <th className={styles.headerCell}>2021</th>
              <th className={styles.headerCell}>2030</th>
              <th className={styles.headerCell}>2040</th>
              <th className={styles.headerCell}>2050</th>
              <th colSpan={3} className={styles.headerCell}>
                Évolution annuelle moyenne en valeurs
              </th>
              <th colSpan={3} className={styles.headerCell}>
                Évolution annuelle moyenne en pourcentage
              </th>
              <th className={styles.headerCell}>Maximum atteint en :</th>
            </tr>
            <tr>
              <th colSpan={4} className={styles.emptyCell}></th>
              <th className={styles.headerCell}>2021-2030</th>
              <th className={styles.headerCell}>2030-2040</th>
              <th className={styles.headerCell}>2040-2050</th>
              <th className={styles.headerCell}>2021-2030</th>
              <th className={styles.headerCell}>2030-2040</th>
              <th className={styles.headerCell}>2040-2050</th>
              <th className={styles.emptyCell}></th>
            </tr>
          </thead>
          <tbody>
            {dataTable.map((row) => {
              const territoryName = Object.keys(row)[0]
              const territoryData = Object.values(row)[0]
              const scenarios: Array<{ key: ScenarioKey; name: string }> = [
                { key: 'haute', name: 'Population Haute' },
                { key: 'central', name: 'Population Centrale' },
                { key: 'basse', name: 'Population Basse' },
              ]

              return scenarios.map((scenario, scenarioIndex) => (
                <tr key={`${territoryName}-${scenario.key}`}>
                  {scenarioIndex === 0 && (
                    <td rowSpan={3} className={styles.sectionCell}>
                      {territoryName}
                    </td>
                  )}
                  <td className={styles.scenarioCell}>{scenario.name}</td>
                  <td className={styles.dataCell}>{formatNumber(territoryData['2021'][scenario.key])}</td>
                  <td className={styles.dataCell}>{formatNumber(territoryData['2030'][scenario.key])}</td>
                  <td className={styles.dataCell}>{formatNumber(territoryData['2040'][scenario.key])}</td>
                  <td className={styles.dataCell}>{formatNumber(territoryData['2050'][scenario.key])}</td>
                  <td className={styles.dataCell}>
                    {territoryData.annualEvolution['2021-2030']?.[scenario.key]?.value
                      ? formatNumber(territoryData.annualEvolution['2021-2030'][scenario.key].value)
                      : '-'}
                  </td>
                  <td className={styles.dataCell}>
                    {territoryData.annualEvolution['2030-2040']?.[scenario.key]?.value
                      ? formatNumber(territoryData.annualEvolution['2030-2040'][scenario.key].value)
                      : '-'}
                  </td>
                  <td className={styles.dataCell}>
                    {territoryData.annualEvolution['2040-2050']?.[scenario.key]?.value
                      ? formatNumber(territoryData.annualEvolution['2040-2050'][scenario.key].value)
                      : '-'}
                  </td>
                  <td className={styles.dataCell}>{territoryData.annualEvolution['2021-2030']?.[scenario.key]?.percent || '-'}</td>
                  <td className={styles.dataCell}>{territoryData.annualEvolution['2030-2040']?.[scenario.key]?.percent || '-'}</td>
                  <td className={styles.dataCell}>{territoryData.annualEvolution['2040-2050']?.[scenario.key]?.percent || '-'}</td>
                  <td className={styles.dataCell}>{territoryData.maxYears[scenario.key].year || '-'}</td>
                </tr>
              ))
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
