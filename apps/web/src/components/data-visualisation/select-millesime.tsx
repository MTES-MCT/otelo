'use client'

import { Select } from '@codegouvfr/react-dsfr/Select'
import { parseAsString, useQueryStates } from 'nuqs'
import { FC, useEffect } from 'react'
import { useDataPackVersions } from '~/hooks/use-data-pack-versions'

export const SelectMillesime: FC = () => {
  const { data: dataPackVersions } = useDataPackVersions()
  const [queryStates, setQueryStates] = useQueryStates({
    millesime: parseAsString,
    type: parseAsString,
    source: parseAsString,
    epci: parseAsString,
  })

  const activeVersion = dataPackVersions?.find((dp) => dp.isActive)

  // Set default millesime to the active version on first load
  useEffect(() => {
    if (!queryStates.millesime && activeVersion) {
      setQueryStates({ millesime: activeVersion.millesime })
    }
  }, [activeVersion, queryStates.millesime, setQueryStates])

  if (!dataPackVersions) {
    return null
  }

  return (
    <Select
      label={undefined}
      nativeSelectProps={{
        onChange: (event) => setQueryStates({ millesime: event.target.value }),
        value: queryStates.millesime || activeVersion?.millesime || '',
      }}
    >
      {dataPackVersions.map((dp) => (
        <option key={dp.millesime} value={dp.millesime}>
          {dp.label}
        </option>
      ))}
    </Select>
  )
}
