'use client'

import { Range } from '@codegouvfr/react-dsfr/Range'
import { useQueryState } from 'nuqs'
import { FC, useEffect } from 'react'

export const SelectProjectionPeriod: FC = () => {
  const [projection, setProjection] = useQueryState('projection')

  useEffect(() => {
    if (!projection) {
      setProjection('2030')
    }
  }, [projection, setProjection])

  return (
    <Range
      label="Faites glisser le curseur pour établir l'horizon de temps du scénario."
      max={2050}
      min={2021}
      nativeInputProps={{ onChange: (e) => setProjection(e.target.value), value: projection ?? '2030' }}
    />
  )
}
