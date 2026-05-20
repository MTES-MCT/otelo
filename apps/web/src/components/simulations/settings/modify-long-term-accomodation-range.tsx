import { Range } from '@codegouvfr/react-dsfr/Range'
import { FC } from 'react'
import { useSimulationSettings } from '~/app/(authenticated)/simulation/[id]/modifier/(demographic-modification)/simulation-scenario-modification-provider'
import { useAccommodationRatesByEpci } from '~/hooks/use-accommodation-rate-epci'
import { useModifyPeakYears } from '~/hooks/use-simulation-peak-years'

interface ModifyLongTermAccomodationRangeProps {
  epci: string
}

export const ModifyLongTermAccomodationRange: FC<ModifyLongTermAccomodationRangeProps> = ({ epci }) => {
  const { simulationSettings, updateRates } = useSimulationSettings()
  const { data: originalRatesData } = useAccommodationRatesByEpci([epci], simulationSettings.millesime)
  const { peakYears } = useModifyPeakYears()

  const currentRates = simulationSettings.epciScenarios[epci]
  const originalLongTermVacancyRate = originalRatesData?.[epci]?.longTermVacancyRate || 0

  const epciPeakYear = peakYears[epci]
  const millesimeNum = Number(simulationSettings.millesime)
  const isPeakBeforeProjection = epciPeakYear !== undefined && epciPeakYear < simulationSettings.projection
  const isLockedByMillesime = isPeakBeforeProjection && epciPeakYear! <= millesimeNum
  const targetYear = isPeakBeforeProjection ? epciPeakYear : simulationSettings.projection

  const getCurrentRangeValue = (): number => {
    if (currentRates?.longTermVacancyRate === undefined || !originalLongTermVacancyRate) return 0
    const reduction = originalLongTermVacancyRate - currentRates.longTermVacancyRate
    const percentage = (reduction / originalLongTermVacancyRate) * 100
    return Math.round(percentage * 100) / 100
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rangeValue = Number(e.target.value)
    const reductionAmount = (rangeValue / 100) * originalLongTermVacancyRate
    const longTermRate = originalLongTermVacancyRate - reductionAmount

    updateRates(epci, {
      longTermVacancyRate: longTermRate,
    })
  }

  const reductionPercent = getCurrentRangeValue()
  const projectedRate = originalLongTermVacancyRate * (1 - reductionPercent / 100)

  return (
    <div className="fr-col-8">
      <Range
        label={`De quel pourcentage souhaitez-vous réduire ce taux d'ici ${targetYear} ?`}
        max={100}
        min={0}
        nativeInputProps={{
          onChange: handleChange,
          value: reductionPercent,
          disabled: isLockedByMillesime,
        }}
      />
      <p className="fr-text--sm fr-mt-1w fr-mb-0">
        Le taux projeté à l'année {targetYear} est de : {(originalLongTermVacancyRate * 100).toFixed(2)} % -{' '}
        {((reductionPercent / 100) * originalLongTermVacancyRate * 100).toFixed(2)} % ={' '}
        <strong>{(projectedRate * 100).toFixed(2)} %</strong>
      </p>
    </div>
  )
}
