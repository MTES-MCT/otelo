'use client'

import { Range } from '@codegouvfr/react-dsfr/Range'
import { TAccommodationRates } from '@otelo/shared'
import { FC, useState } from 'react'
import { useSimulationSettings } from '~/app/(authenticated)/simulation/[id]/modifier/(demographic-modification)/simulation-scenario-modification-provider'
import { ReadingKey } from '~/components/ui/reading-key'
import { useAccommodationRatesByEpci } from '~/hooks/use-accommodation-rate-epci'

interface ModifyAllEpcisAccommodationRangeProps {
  targetYear: number | null
}

export const ModifyAllEpcisAccommodationRange: FC<ModifyAllEpcisAccommodationRangeProps> = ({ targetYear }) => {
  const { simulationSettings, updateAllRates } = useSimulationSettings()
  const epciIds = Object.keys(simulationSettings.epciScenarios)
  const { data: originalRatesData } = useAccommodationRatesByEpci(epciIds, simulationSettings.millesime)
  const [reductionPercent, setReductionPercent] = useState(15)

  const applyReductionToAllEpcis = (rangeValue: number) => {
    if (!originalRatesData) return

    const newRatesPerEpci: Record<string, Partial<TAccommodationRates>> = {}
    epciIds.forEach((epciId) => {
      const originalRate = originalRatesData[epciId]?.longTermVacancyRate || 0
      const reductionAmount = (rangeValue / 100) * originalRate
      newRatesPerEpci[epciId] = { longTermVacancyRate: originalRate - reductionAmount }
    })

    updateAllRates(newRatesPerEpci)
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rangeValue = Number(e.target.value)
    setReductionPercent(rangeValue)
    applyReductionToAllEpcis(rangeValue)
  }

  return (
    <>
      <div className="fr-col-12 fr-col-md-8">
        <Range
          // La question est posée juste au-dessus, en toutes lettres : le libellé ne sert qu'aux lecteurs d'écran.
          label={`Réduction du taux de vacance longue durée de chaque EPCI d'ici ${targetYear}`}
          classes={{ label: 'fr-sr-only' }}
          suffix="%"
          max={100}
          min={0}
          nativeInputProps={{
            onChange: handleChange,
            value: reductionPercent,
          }}
        />
      </div>
      <ReadingKey className="fr-mt-3w">
        Le taux de vacance longue durée de <strong>chaque EPCI</strong> sera réduit de <strong>{reductionPercent} %</strong> d&apos;ici{' '}
        {targetYear}, à partir de son propre taux observé.
      </ReadingKey>
    </>
  )
}
