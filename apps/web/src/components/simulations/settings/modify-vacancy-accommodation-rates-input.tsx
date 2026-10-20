'use client'

import { TAccommodationRates } from '@shared'
import { FC } from 'react'
import { ModifyLongTermAccomodationRange } from '~/components/simulations/settings/modify-long-term-accomodation-range'

type ModifyVacancyAccommodationRatesInputProps = {
  epci: string
  epciName: string
  epciRates: TAccommodationRates
}

export const ModifyVacancyAccommodationRatesInput: FC<ModifyVacancyAccommodationRatesInputProps> = ({ epci, epciName }) => {
  return (
    <div className="fr-flex fr-direction-column fr-flex-gap-2v">
      <ModifyLongTermAccomodationRange epci={epci} epciName={epciName} />
    </div>
  )
}
