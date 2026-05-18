import { Range } from '@codegouvfr/react-dsfr/Range'
import { parseAsInteger, parseAsString, useQueryState } from 'nuqs'
import { FC, useEffect } from 'react'
import { useEpcisRates } from '~/app/(authenticated)/simulation/(creation)/(rates-provider)/rates-provider'
import { useCreationPreviewPayload } from '~/hooks/use-creation-preview-payload'
import { useSimulationPreview } from '~/hooks/use-simulation-preview'

interface CreateLongTermAccomodationRangeProps {
  epci: string
}
export const CreateLongTermAccomodationRange: FC<CreateLongTermAccomodationRangeProps> = ({ epci }) => {
  const [projection] = useQueryState('projection', parseAsInteger)
  const [millesime] = useQueryState('millesime', parseAsString)
  const { payload, enabled } = useCreationPreviewPayload()
  const { data } = useSimulationPreview(payload, { enabled })

  const epciPeakYear = data?.flowRequirement?.epcis?.find((e) => e.code === epci)?.data.peakYear ?? null
  const millesimeNum = millesime ? Number(millesime) : null
  const isPeakBeforeProjection = epciPeakYear !== null && projection !== null && epciPeakYear < projection
  const isLockedByMillesime = isPeakBeforeProjection && millesimeNum !== null && epciPeakYear! <= millesimeNum
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
