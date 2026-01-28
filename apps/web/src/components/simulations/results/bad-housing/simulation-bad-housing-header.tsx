'use client'

import { parseAsString, useQueryState } from 'nuqs'
import { formatNumber } from '~/utils/format-numbers'

const getCategoryLabel = (categoryName: string) => {
  const categoryLabels = {
    Hébergés: "personnes hébergées dans un logement qui n'est pas le leur",
    'Hors logement': "personnes hors-logement (sans abri, logés à l'hôtel, habitat de fortune) ou en hébergement social",
    'Inadéquation financière': "ménages ayant un taux d'effort trop important",
    'Inadéquation physique': 'ménages dans un logement trop petit',
    'Mauvaise qualité': 'ménages habitant un logement précaire',
  }
  return categoryLabels[categoryName as keyof typeof categoryLabels] || `de catégorie "${categoryName}"`
}

type SimulationBadHousingDescriptionProps = {
  horizon: number
  totalStock: number
  maxValue: number
  maxValueName: string
}

export const SimulationBadHousingDescription = ({ horizon, totalStock, maxValue, maxValueName }: SimulationBadHousingDescriptionProps) => {
  const [queryState] = useQueryState('mal-logement', parseAsString.withDefault('graphique'))
  const currentYear = new Date().getFullYear()

  return (
    <p className="fr-mt-2w">
      La résorption du besoin en stock sur la période&nbsp;
      {currentYear} à {horizon} ans (soit {horizon - currentYear} ans) implique&nbsp;
      <span className="fr-text--bold">{formatNumber(totalStock)}</span> logements à produire. Le {queryState} ci-dessous précise la
      ventilation de ce besoin par type de mal-logement. Par exemple, <span className="fr-text--bold">{formatNumber(maxValue)}</span>
      &nbsp;logements devront être créés pour répondre aux besoins des {getCategoryLabel(maxValueName)}.
    </p>
  )
}
