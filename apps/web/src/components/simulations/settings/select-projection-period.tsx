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

  const projectionValue = projection ?? '2030'

  return (
    <>
      <Range
        label="Faites glisser le curseur pour établir l'horizon de temps du scénario."
        max={2050}
        min={2021}
        nativeInputProps={{ onChange: (e) => setProjection(e.target.value), value: projectionValue }}
      />
      <p className="fr-text--sm fr-mt-1w fr-text-mention--grey">
        Période de projection : 1er janvier 2021 au 1er janvier {projectionValue}
      </p>
    </>
  )
}
