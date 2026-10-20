'use client'

import { Range } from '@codegouvfr/react-dsfr/Range'
import { useQueryState } from 'nuqs'
import { FC, useEffect } from 'react'
import { ReadingKey } from '~/components/ui/reading-key'
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
      <div>
        <Range
          label="Horizon de temps"
          prefix="1er janvier "
          max={MAX_PROJECTION_YEAR}
          min={minYear}
          nativeInputProps={{ onChange: (e) => setProjection(e.target.value), value: projectionValue }}
        />
      </div>
      <ReadingKey className="fr-mt-4w">
        Votre estimation portera du <strong>1er janvier {millesime}</strong> au <strong>1er janvier {projectionValue}</strong>.
      </ReadingKey>
    </>
  )
}
