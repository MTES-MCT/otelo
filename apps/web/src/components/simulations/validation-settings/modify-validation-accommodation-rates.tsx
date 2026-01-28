'use client'

import { fr, RiIconClassName } from '@codegouvfr/react-dsfr'
import Input from '@codegouvfr/react-dsfr/Input'
import Tabs from '@codegouvfr/react-dsfr/Tabs'
import { parseAsString, useQueryStates } from 'nuqs'
import { FC } from 'react'
import { tss } from 'tss-react'
import { useSimulationSettings } from '~/app/(authenticated)/simulation/[id]/modifier/(demographic-modification)/simulation-scenario-modification-provider'
import { useBassinEpcis } from '~/hooks/use-bassin-epcis'
import { useEpcis } from '~/hooks/use-epcis'
import { TEpcisAccommodationRates } from '@shared'

interface TabChildrenProps {
  rates: TEpcisAccommodationRates[string]
}

const TabChildren: FC<TabChildrenProps> = ({ rates }) => {
  const { classes } = useStyles()
  const { shortTermVacancyRate, longTermVacancyRate, txRs } = rates

  return (
    <div className={classes.container}>
      <Input
        disabled
        label=""
        iconId="ri-percent-line"
        hintText="Taux cible de logements vacants courte durée"
        nativeInputProps={{ value: (Number(shortTermVacancyRate) * 100).toFixed(2) }}
        className={classes.flex}
      />
      <Input
        disabled
        label=""
        iconId="ri-percent-line"
        hintText="Taux cible de logements vacants longue durée"
        nativeInputProps={{ value: (Number(longTermVacancyRate) * 100).toFixed(2) }}
        className={classes.flex}
      />
      <Input
        disabled
        className={classes.flex}
        label=""
        iconId="ri-percent-line"
        hintText="Taux cible de résidences secondaires"
        nativeInputProps={{ value: (Number(txRs) * 100).toFixed(2) }}
      />
    </div>
  )
}

type ModifyValidationSettingsRatesProps = {
  epcis?: string[]
}
export const ModifyValidationAccommodationsSettingsRates: FC<ModifyValidationSettingsRatesProps> = ({ epcis }) => {
  const { data: epcisList } = useEpcis(epcis)
  const { data: bassinEpcis } = useBassinEpcis()
  const [queryStates] = useQueryStates({
    baseEpci: parseAsString,
  })
  const { simulationSettings } = useSimulationSettings()

  const tabs = Object.entries(simulationSettings.epciScenarios)
    .map(([epci, rates]) => ({
      epci,
      content: <TabChildren rates={rates} />,
      iconId: 'ri-road-map-line' as RiIconClassName,
      label: [...(epcisList || []), ...(bassinEpcis || [])]?.find((bassinEpci) => bassinEpci.code === epci)?.name,
    }))
    .sort((a, b) => {
      if (a.epci === queryStates.baseEpci) return -1
      if (b.epci === queryStates.baseEpci) return 1
      return 0
    })

  return (
    <div className={fr.cx('fr-p-2w')} style={{ backgroundColor: fr.colors.decisions.background.default.grey.default }}>
      <h4>Taux cible de résidences secondaires et logements vacants</h4>
      <Tabs tabs={tabs} />
    </div>
  )
}

const useStyles = tss.create({
  container: {
    display: 'flex',
    gap: '1rem',
  },
  flex: {
    flex: 1,
  },
})
