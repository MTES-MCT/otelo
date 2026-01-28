'use client'

import { FC } from 'react'
import { ModifyLongTermAccomodationRange } from '~/components/simulations/settings/modify-long-term-accomodation-range'
import { TAccommodationRates } from '@shared'

type ModifyVacancyAccommodationRatesInputProps = {
  epci: string
  epciRates: TAccommodationRates
}

export const ModifyVacancyAccommodationRatesInput: FC<ModifyVacancyAccommodationRatesInputProps> = ({ epci }) => {
  return (
    <div className="fr-flex fr-direction-column fr-flex-gap-2v">
      <ModifyLongTermAccomodationRange epci={epci} />
    </div>
  )
}
