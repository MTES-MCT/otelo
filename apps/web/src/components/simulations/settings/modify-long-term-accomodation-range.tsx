import { Range } from '@codegouvfr/react-dsfr/Range'
import { FC } from 'react'
import { useSimulationSettings } from '~/app/(authenticated)/simulation/[id]/modifier/(demographic-modification)/simulation-scenario-modification-provider'
import { useAccommodationRatesByEpci } from '~/hooks/use-accommodation-rate-epci'
import { useModifyPeakYears } from '~/hooks/use-simulation-peak-years'
import { LongTermVacancyReadingKey } from './long-term-vacancy-texts'

interface ModifyLongTermAccomodationRangeProps {
  epci: string
  epciName: string
}

export const ModifyLongTermAccomodationRange: FC<ModifyLongTermAccomodationRangeProps> = ({ epci, epciName }) => {
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
    <>
      <div className="fr-col-12 fr-col-md-8">
        <Range
          // La question est posée juste au-dessus, en toutes lettres : le libellé ne sert qu'aux lecteurs d'écran.
          label={`Réduction du taux de vacance longue durée de ${epciName} d'ici ${targetYear}`}
          classes={{ label: 'fr-sr-only' }}
          suffix="%"
          max={100}
          min={0}
          nativeInputProps={{
            onChange: handleChange,
            value: reductionPercent,
            disabled: isLockedByMillesime,
          }}
        />
      </div>
      <LongTermVacancyReadingKey territoryLabel={epciName} projectedRate={projectedRate} targetYear={targetYear} />
    </>
  )
}
