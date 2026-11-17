'use client'

import { parseAsInteger, parseAsString, useQueryStates } from 'nuqs'
import { FC } from 'react'
import { type TAgePyramid, toAgePyramidBands } from '~/schemas/age-pyramid'
import { formatNumber } from '~/utils/format-numbers'

/**
 * Vue tableau de la pyramide. Elle lit les mêmes réglages d'URL que le graphique — année, densité —
 * pour que la bascule graphique/tableau montre exactement le même découpage.
 */
export const AgePyramidTable: FC<{ data: TAgePyramid }> = ({ data }) => {
  const [queryStates] = useQueryStates({
    pyramidYear: parseAsInteger,
    pyramidDensity: parseAsString.withDefault('quinquennal'),
  })

  if (!data.available) return null

  const density = queryStates.pyramidDensity === 'age' ? 'age' : 'quinquennal'
  const lastYear = data.years[data.years.length - 1]
  const year = queryStates.pyramidYear !== null && data.years.includes(queryStates.pyramidYear) ? queryStates.pyramidYear : lastYear

  const referenceIndex = Math.max(0, data.years.indexOf(data.referenceYear))
  const referenceYear = data.years[referenceIndex]
  const bands = toAgePyramidBands(data.ages, referenceIndex, data.years.indexOf(year), density)

  const round = (value: number) => formatNumber(Math.round(value))

  return (
    <div className="fr-table fr-table--bordered">
      <table>
        <caption>
          Population par âge et sexe — {data.zone.label}, {referenceYear} et {year}
        </caption>
        <thead>
          <tr>
            <th scope="col">Âge</th>
            <th scope="col">Hommes {referenceYear}</th>
            <th scope="col">Hommes {year}</th>
            <th scope="col">Femmes {referenceYear}</th>
            <th scope="col">Femmes {year}</th>
            <th scope="col">Écart total</th>
          </tr>
        </thead>
        <tbody>
          {[...bands].reverse().map((band) => {
            const difference = band.men + band.women - (band.menRef + band.womenRef)
            return (
              <tr key={band.label}>
                <td>{band.ageFrom === band.ageTo ? `${band.ageFrom} ans` : `${band.ageFrom} à ${band.ageTo} ans`}</td>
                <td>{round(band.menRef)}</td>
                <td>{round(band.men)}</td>
                <td>{round(band.womenRef)}</td>
                <td>{round(band.women)}</td>
                <td>
                  {difference > 0 ? '+' : difference < 0 ? '−' : ''}
                  {round(Math.abs(difference))}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
