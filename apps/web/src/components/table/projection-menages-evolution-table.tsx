'use client'

import { parseAsString, useQueryState } from 'nuqs'
import { FC } from 'react'
import {
  TDemographicMenagesMaxYearsByEpci,
  TDemographicProjectionDataTable,
  TDemographicProjectionDataTableRow,
} from '~/schemas/population-evolution'
import { formatNumber } from '~/utils/format-numbers'
import styles from './projection-evolution-table.module.css'

type ScenarioKey = 'basse' | 'central' | 'haute'

export type ProjectionMenagesEvolutionTableProps = {
  data: TDemographicProjectionDataTable
  maxYears: TDemographicMenagesMaxYearsByEpci
}

export const ProjectionMenagesEvolutionTable: FC<ProjectionMenagesEvolutionTableProps> = ({ data, maxYears }) => {
  const [populationType] = useQueryState('populationType', parseAsString.withDefault('haute'))

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
      <h2 className={styles.title}>Tableau descriptif et d'analyse des projections de ménages, sur le bassin d'habitat</h2>

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
                { key: 'haute', name: 'Décohabitation haute' },
                { key: 'central', name: 'Décohabitation tendanciel' },
                { key: 'basse', name: 'Décohabitation basse' },
              ]
              const prefix = populationType === 'haute' ? 'ph' : populationType === 'central' ? 'central' : 'pb'

              function getMaxYearsKey(scenario: ScenarioKey): keyof typeof territoryData.maxYears {
                switch (scenario) {
                  case 'haute':
                    return `${prefix}H`
                  case 'central':
                    return `${prefix}C`
                  case 'basse':
                    return `${prefix}B`
                  default:
                    return `${prefix}C`
                }
              }

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
                  <td className={styles.dataCell}>
                    {territoryData.maxYears && territoryData.maxYears[getMaxYearsKey(scenario.key)]
                      ? territoryData.maxYears[getMaxYearsKey(scenario.key)].year !== 0
                        ? territoryData.maxYears[getMaxYearsKey(scenario.key)].year
                        : '-'
                      : '-'}
                  </td>
                </tr>
              ))
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
