'use client'

import Table from '@codegouvfr/react-dsfr/Table'
import { parseAsString, useQueryState } from 'nuqs'
import { StockEvolutionChart } from '~/components/charts/stock-evolution-chart'
import { formatNumber } from '~/utils/format-numbers'

export const SimulationBadHousingDataWrapper = ({
  chartData,
  horizon,
  results,
}: {
  chartData: { name: string; value: number }[]
  horizon: number
  results: {
    badQuality: number
    financialInadequation: number
    hosted: number
    noAccomodation: number
    physicalInadequation: number
    totalStock: number
  }
}) => {
  const [queryState] = useQueryState('mal-logement', parseAsString.withDefault('graphique'))

  if (queryState === 'graphique') {
    return <StockEvolutionChart chartData={chartData} horizon={horizon} />
  }

  if (queryState === 'tableau') {
    const { badQuality, financialInadequation, hosted, noAccomodation, physicalInadequation, totalStock } = results
    return (
      <Table
        className="fr-mb-0"
        noCaption
        caption="Résumé des besoins en stock"
        data={[
          ['Hébergés', formatNumber(hosted), `${Number((hosted / totalStock) * 100).toFixed(1)} %`],
          ['Hors logement', formatNumber(noAccomodation), `${Number((noAccomodation / totalStock) * 100).toFixed(1)} %`],
          [
            'Inadéquation financière',
            formatNumber(financialInadequation),
            `${Number((financialInadequation / totalStock) * 100).toFixed(1)} %`,
          ],
          [
            'Inadéquation physique',
            formatNumber(physicalInadequation),
            `${Number((physicalInadequation / totalStock) * 100).toFixed(1)} %`,
          ],
          ['Mauvaise qualité', formatNumber(badQuality), `${Number((badQuality / totalStock) * 100).toFixed(1)} %`],
          ['Total', formatNumber(totalStock), '-'],
        ]}
        fixed
        headers={['Catégorie', 'Besoin calculé', 'en % du total']}
      />
    )
  }

  return null
}
