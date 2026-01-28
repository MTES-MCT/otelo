'use client'

import Checkbox from '@codegouvfr/react-dsfr/Checkbox'
import { parseAsArrayOf, parseAsString, useQueryStates } from 'nuqs'
import { ComponentProps, FC, useEffect } from 'react'

import { useDataVisualisation } from '~/hooks/use-data-visualisation'

export const DataVisualisationFilters: FC = () => {
  const { data } = useDataVisualisation()
  const [queryStates, setQueryStates] = useQueryStates({
    epcis: parseAsArrayOf(parseAsString, ','),
    epci: parseAsString,
  })

  const epcis = Object.keys(data?.linearChart ?? {}).map((epci) => data?.linearChart[epci].epci)

  useEffect(() => {
    if (!queryStates.epcis && queryStates.epci) {
      setQueryStates({ epcis: [queryStates.epci] })
    }
  }, [epcis, queryStates, setQueryStates])

  const { epcis: queryEpcis } = queryStates
  const options: ComponentProps<typeof Checkbox>['options'] = epcis.map((epci) => ({
    label: epci.name,
    nativeInputProps: {
      checked: queryEpcis?.includes(epci.code),
      disabled: queryEpcis?.length === 1 && queryEpcis.includes(epci.code),
      name: epci.name,
      onChange: (e) => {
        const currentEpcis = queryEpcis ?? []
        const newEpcis = e.target.checked ? [...currentEpcis, e.target.value] : currentEpcis.filter((epci) => epci !== e.target.value)
        setQueryStates({ epcis: newEpcis })
      },
      value: epci.code,
    },
  }))

  return <Checkbox options={options} orientation="horizontal" />
}
