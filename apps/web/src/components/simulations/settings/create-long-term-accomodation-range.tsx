import { Range } from '@codegouvfr/react-dsfr/Range'
import { FC, useEffect } from 'react'
import { useEpcisRates } from '~/app/(authenticated)/simulation/(creation)/(rates-provider)/rates-provider'
import { useCreationPeakYears } from '~/hooks/use-simulation-peak-years'

interface CreateLongTermAccomodationRangeProps {
  epci: string
}
export const CreateLongTermAccomodationRange: FC<CreateLongTermAccomodationRangeProps> = ({ epci }) => {
  const { peakYears, projection, millesime } = useCreationPeakYears()

  const epciPeakYear = peakYears[epci] ?? null
  const isPeakBeforeProjection = epciPeakYear !== null && projection !== null && epciPeakYear < projection
  const isLockedByMillesime = isPeakBeforeProjection && millesime !== null && epciPeakYear! <= millesime
  const targetYear = isPeakBeforeProjection ? epciPeakYear : projection

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

  const reductionPercent = getCurrentRangeValue()
  const projectedRate = defaultEpciRates.longTermVacancyRate * (1 - reductionPercent / 100)

  return (
    <>
      <Range
        label={`De quel pourcentage souhaitez-vous réduire ce taux d'ici ${targetYear} ?`}
        suffix="%"
        max={100}
        min={0}
        nativeInputProps={{
          onChange: handleChange,
          value: reductionPercent,
          disabled: isLockedByMillesime,
        }}
      />
      <p className="fr-text--sm fr-mt-1w fr-mb-0">
        Le taux projeté à l'année {targetYear} est de : {(defaultEpciRates.longTermVacancyRate * 100).toFixed(2)} % -{' '}
        {((reductionPercent / 100) * defaultEpciRates.longTermVacancyRate * 100).toFixed(2)} % ={' '}
        <strong>{(projectedRate * 100).toFixed(2)} %</strong>
      </p>
    </>
  )
}
