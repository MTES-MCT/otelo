import { Range } from '@codegouvfr/react-dsfr/Range'
import { FC } from 'react'
import { useEpcisRates } from '~/app/(authenticated)/simulation/(creation)/(rates-provider)/rates-provider'
import { useCreationPeakYears } from '~/hooks/use-simulation-peak-years'
import { LongTermVacancyReadingKey } from './long-term-vacancy-texts'

interface CreateLongTermAccomodationRangeProps {
  epci: string
  epciName: string
}
export const CreateLongTermAccomodationRange: FC<CreateLongTermAccomodationRangeProps> = ({ epci, epciName }) => {
  const { peakYears, projection, millesime } = useCreationPeakYears()

  const epciPeakYear = peakYears[epci] ?? null
  const isPeakBeforeProjection = epciPeakYear !== null && projection !== null && epciPeakYear < projection
  const isLockedByMillesime = isPeakBeforeProjection && millesime !== null && epciPeakYear! <= millesime
  const targetYear = isPeakBeforeProjection ? epciPeakYear : projection

  const { defaultRates, rates, updateRates } = useEpcisRates()
  const currentRates = rates[epci]
  const defaultEpciRates = defaultRates[epci]

  // Le défaut de réduction est posé pour tous les EPCI par `useDefaultLongTermVacancyReduction`,
  // au-dessus des onglets : ce champ ne fait que lire et écrire la valeur courante.
  if (!currentRates || !defaultEpciRates) return null

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
