'use client'

import { FC } from 'react'
import { useEpcisRates } from '~/app/(authenticated)/simulation/(creation)/(rates-provider)/rates-provider'
import { CreateLongTermAccomodationRange } from '~/components/simulations/settings/create-long-term-accomodation-range'

type CreateVacancyAccommodationRatesInputProps = {
  epci: string
  epciName: string
}

export const CreateVacancyAccommodationRatesInput: FC<CreateVacancyAccommodationRatesInputProps> = ({ epci, epciName }) => {
  const { rates } = useEpcisRates()
  const ratesByEpci = rates[epci]

  if (!ratesByEpci) return null

  return (
    <div>
      <CreateLongTermAccomodationRange epci={epci} epciName={epciName} />
    </div>
  )
}
