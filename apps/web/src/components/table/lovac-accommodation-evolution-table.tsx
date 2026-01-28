import { FC } from 'react'
import { TAccommodationLovacEvolutionDataTable } from '~/schemas/accommodation-evolution'
import { formatNumber } from '~/utils/format-numbers'
import styles from './projection-evolution-table.module.css'

interface LovacAccommodationEvolutionTableProps {
  data: TAccommodationLovacEvolutionDataTable
}

export const LovacAccommodationEvolutionTable: FC<LovacAccommodationEvolutionTableProps> = ({ data }) => {
  const dataTable = Object.entries(data).map((row) => {
    const rowValue = row[1]
    return {
      [rowValue.name]: {
        '2014': { ...rowValue[2014] },
        '2019': { ...rowValue[2019] },
        '2024': { ...rowValue[2024] },
        annualEvolution: rowValue.annualEvolution,
      },
    }
  })
  const title = 'Logements vacants'
  const scenarios = [
    { key: 'Less', name: 'Logements vacants < 2 ans' },
    { key: 'More', name: 'Logements vacants > 2 ans' },
  ]
  return (
    <div className={styles.container}>
      <h2 className={styles.title}>Tableau descriptif et d'analyse des logements vacants sur le bassin d’habitat</h2>
      <table className={styles.table}>
        <thead>
          <tr>
            <th rowSpan={3} className={styles.headerCell}>
              BH/EPCI
            </th>
            <th rowSpan={3} className={styles.headerCell}>
              Scénarios
            </th>
            <th colSpan={6} className={styles.headerCell}>
              {title}
            </th>
            <th colSpan={4} className={styles.headerCell}>
              Evolution moyenne annuelle
            </th>
          </tr>
          <tr>
            <th colSpan={3} className={styles.headerCell}>
              Volume
            </th>
            <th colSpan={3} className={styles.headerCell}>
              Part
            </th>
            <th colSpan={2} className={styles.headerCell}>
              Volume
            </th>
            <th colSpan={2} className={styles.headerCell}>
              point de %
            </th>
          </tr>
          <tr>
            <th className={styles.headerCell}>2014</th>
            <th className={styles.headerCell}>2019</th>
            <th className={styles.headerCell}>2024</th>
            <th className={styles.headerCell}>2014</th>
            <th className={styles.headerCell}>2019</th>
            <th className={styles.headerCell}>2024</th>
            <th className={styles.headerCell}>2014 - 2019</th>
            <th className={styles.headerCell}>2019 - 2024</th>
            <th className={styles.headerCell}>2014 - 2019</th>
            <th className={styles.headerCell}>2019 - 2024</th>
          </tr>
        </thead>
        <tbody>
          {Object.entries(dataTable).map(([_, value]) => {
            const territoryName = Object.keys(value)[0]
            const territoryData = Object.values(value)[0]

            return scenarios.map((scenario, scenarioIndex) => (
              <tr key={`${territoryName}-${scenario.key}`}>
                {scenarioIndex === 0 && (
                  <td rowSpan={2} className={styles.sectionCell}>
                    {territoryName}
                  </td>
                )}
                <td className={styles.scenarioCell}>{scenario.name}</td>
                <td className={styles.dataCell}>
                  {formatNumber(territoryData['2014'][`nbLogVac2${scenario.key}` as keyof (typeof territoryData)['2014']])}
                </td>
                <td className={styles.dataCell}>
                  {formatNumber(territoryData['2019'][`nbLogVac2${scenario.key}` as keyof (typeof territoryData)['2019']])}
                </td>
                <td className={styles.dataCell}>
                  {formatNumber(territoryData['2024'][`nbLogVac2${scenario.key}` as keyof (typeof territoryData)['2024']])}
                </td>
                <td className={styles.dataCell}>
                  {territoryData['2014'][`propLogVac2${scenario.key}` as keyof (typeof territoryData)['2014']]}
                </td>
                <td className={styles.dataCell}>
                  {territoryData['2019'][`propLogVac2${scenario.key}` as keyof (typeof territoryData)['2019']]}
                </td>
                <td className={styles.dataCell}>
                  {territoryData['2024'][`propLogVac2${scenario.key}` as keyof (typeof territoryData)['2024']]}
                </td>
                <td className={styles.dataCell}>
                  {formatNumber(
                    territoryData.annualEvolution['2014-2019'][
                      `nbLogVac2${scenario.key}` as keyof (typeof territoryData.annualEvolution)['2014-2019']
                    ].value,
                  ) || '-'}
                </td>
                <td className={styles.dataCell}>
                  {formatNumber(
                    territoryData.annualEvolution['2019-2024'][
                      `nbLogVac2${scenario.key}` as keyof (typeof territoryData.annualEvolution)['2019-2024']
                    ].value,
                  ) || '-'}
                </td>
                <td className={styles.dataCell}>
                  {territoryData.annualEvolution['2014-2019'][
                    `nbLogVac2${scenario.key}` as keyof (typeof territoryData.annualEvolution)['2014-2019']
                  ].percent || '-'}
                </td>
                <td className={styles.dataCell}>
                  {territoryData.annualEvolution['2019-2024'][
                    `nbLogVac2${scenario.key}` as keyof (typeof territoryData.annualEvolution)['2019-2024']
                  ].percent || '-'}
                </td>
              </tr>
            ))
          })}
        </tbody>
      </table>
    </div>
  )
}
