import { Range } from '@codegouvfr/react-dsfr/Range'
import { useQueryState } from 'nuqs'
import { FC, useEffect } from 'react'
import { useEpcisRates } from '~/app/(authenticated)/simulation/(creation)/(rates-provider)/rates-provider'

interface CreateLongTermAccomodationRangeProps {
  epci: string
}
export const CreateLongTermAccomodationRange: FC<CreateLongTermAccomodationRangeProps> = ({ epci }) => {
  const [projection] = useQueryState('projection')

  const { defaultRates, rates, updateRates } = useEpcisRates()
  const currentRates = rates[epci]
  const defaultEpciRates = defaultRates[epci]

  if (!currentRates || !defaultEpciRates) return null

  useEffect(() => {
    const reductionAmount = (15 / 100) * defaultEpciRates?.longTermVacancyRate
    const longTermRate = defaultEpciRates?.longTermVacancyRate - reductionAmount

    updateRates(epci, {
      longTermVacancyRate: longTermRate,
    })
  }, [])

  const getCurrentRangeValue = (): number => {
    if (currentRates?.longTermVacancyRate === undefined || !defaultEpciRates?.longTermVacancyRate) return 0
    const reduction = defaultEpciRates?.longTermVacancyRate - currentRates.longTermVacancyRate
    const percentage = (reduction / defaultEpciRates?.longTermVacancyRate) * 100
    return Math.round(percentage * 100) / 100
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rangeValue = Number(e.target.value)
    const reductionAmount = (rangeValue / 100) * defaultEpciRates?.longTermVacancyRate
    const longTermRate = defaultEpciRates?.longTermVacancyRate - reductionAmount

    updateRates(epci, {
      longTermVacancyRate: longTermRate,
    })
  }

  return (
    <Range
      label={`De quel pourcentage souhaitez-vous réduire ce taux d'ici ${projection} ?`}
      suffix="%"
      max={100}
      min={0}
      nativeInputProps={{
        onChange: handleChange,
        value: getCurrentRangeValue(),
      }}
    />
  )
}
