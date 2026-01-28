'use client'

import { fr, RiIconClassName } from '@codegouvfr/react-dsfr'
import Input from '@codegouvfr/react-dsfr/Input'
import Tabs from '@codegouvfr/react-dsfr/Tabs'
import { parseAsString, useQueryStates } from 'nuqs'
import { FC } from 'react'
import { tss } from 'tss-react'
import { RateSettings, useEpcisRates } from '~/app/(authenticated)/simulation/(creation)/(rates-provider)/rates-provider'
import { useBassinEpcis } from '~/hooks/use-bassin-epcis'
import { useEpcis } from '~/hooks/use-epcis'

interface TabChildrenProps {
  epci: string
  rates: RateSettings
}

const TabChildren: FC<TabChildrenProps> = ({ rates }) => {
  const { classes } = useStyles()
  const { restructuringRate, disappearanceRate } = rates

  return (
    <div className={classes.container}>
      <Input
        disabled
        label=""
        iconId="ri-percent-line"
        hintText="Taux annuel de restructuration"
        nativeInputProps={{ value: (Number(restructuringRate) * 100).toFixed(2) }}
        className={classes.flex}
      />
      <Input
        disabled
        label=""
        iconId="ri-percent-line"
        hintText="Taux annuel de disparition"
        nativeInputProps={{ value: (Number(disappearanceRate) * 100).toFixed(2) }}
        className={classes.flex}
      />
    </div>
  )
}

type CreateValidationRestructurationDisparitionRatesProps = {
  epcis?: string[]
}
export const CreateValidationRestructurationDisparitionRates: FC<CreateValidationRestructurationDisparitionRatesProps> = ({ epcis }) => {
  const { data: epcisList } = useEpcis(epcis)
  const { data: bassinEpcis } = useBassinEpcis()
  const [queryStates] = useQueryStates({
    baseEpci: parseAsString,
  })
  const { rates } = useEpcisRates()

  const tabs = Object.entries(rates)
    .map(([epci, rates]) => ({
      epci,
      content: <TabChildren epci={epci} rates={rates} />,
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
      <h4>Taux annuel de restructuration et de disparition</h4>
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
