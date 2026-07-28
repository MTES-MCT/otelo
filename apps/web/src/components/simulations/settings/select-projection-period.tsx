'use client'

import { Range } from '@codegouvfr/react-dsfr/Range'
import { useQueryState } from 'nuqs'
import { FC, useEffect } from 'react'
import { clampProjectionYear, DEFAULT_PROJECTION_YEAR, getMinProjectionYear, MAX_PROJECTION_YEAR } from '~/utils/projection'

export const SelectProjectionPeriod: FC = () => {
  const [projection, setProjection] = useQueryState('projection')
  const [millesime] = useQueryState('millesime')
  const minYear = getMinProjectionYear(millesime)

  const projectionValue = clampProjectionYear(Number(projection) || DEFAULT_PROJECTION_YEAR, millesime)

  // Réaligne l'URL quand la projection est absente, ou hors bornes après un changement de millésime.
  useEffect(() => {
    if (projection !== String(projectionValue)) {
      setProjection(String(projectionValue))
    }
  }, [projection, projectionValue, setProjection])

  return (
    <>
      <Range
        label="Faites glisser le curseur pour établir l'horizon de temps du scénario."
        max={MAX_PROJECTION_YEAR}
        min={minYear}
        nativeInputProps={{ onChange: (e) => setProjection(e.target.value), value: projectionValue }}
      />
      <p className="fr-text--sm fr-mt-1w fr-text-mention--grey">
        Période de projection : 1er janvier {millesime} au 1er janvier {projectionValue}
      </p>
    </>
  )
}
