'use client'

import { Select } from '@codegouvfr/react-dsfr/Select'
import { parseAsString, useQueryStates } from 'nuqs'
import { FC, useEffect } from 'react'
import { useDataPackVersions } from '~/hooks/use-data-pack-versions'

export const SelectMillesime: FC = () => {
  const { data: dataPackVersions, isLoading } = useDataPackVersions()
  const [queryStates, setQueryStates] = useQueryStates({
    millesime: parseAsString,
  })

  const activeVersion = dataPackVersions?.find((dp) => dp.isActive)

  // Set default millesime to the active version on first load
  useEffect(() => {
    if (!queryStates.millesime && activeVersion) {
      setQueryStates({ millesime: activeVersion.millesime })
    }
  }, [activeVersion, queryStates.millesime, setQueryStates])

  if (isLoading || !dataPackVersions) {
    return null
  }

  return (
    <Select
      label="Millésime"
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
