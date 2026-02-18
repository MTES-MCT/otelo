'use client'

import Button from '@codegouvfr/react-dsfr/Button'
import { createModal } from '@codegouvfr/react-dsfr/Modal'
import { Select } from '@codegouvfr/react-dsfr/Select'
import { parseAsString, useQueryStates } from 'nuqs'
import { useCallback, useEffect, useRef } from 'react'
import { useDataPackVersions } from '~/hooks/use-data-pack-versions'

const warningModal = createModal({
  id: 'millesime-warning-modal',
  isOpenedByDefault: false,
})

export const MillesimeSelector = () => {
  const { data: dataPackVersions, isLoading } = useDataPackVersions()
  const [queryStates, setQueryStates] = useQueryStates({
    millesime: parseAsString,
  })

  const pendingMillesimeRef = useRef<string | null>(null)
  const activeVersion = dataPackVersions?.find((dp) => dp.isActive)

  // Set default millesime to the active version on first load
  useEffect(() => {
    if (!queryStates.millesime && activeVersion) {
      setQueryStates({ millesime: activeVersion.millesime })
    }
  }, [activeVersion, queryStates.millesime, setQueryStates])

  const handleChange = useCallback(
    (event: React.ChangeEvent<HTMLSelectElement>) => {
      const newMillesime = event.target.value
      const isActive = dataPackVersions?.find((dp) => dp.millesime === newMillesime)?.isActive

      if (!isActive) {
        pendingMillesimeRef.current = newMillesime
        warningModal.open()
      } else {
        setQueryStates({ millesime: newMillesime })
      }
    },
    [dataPackVersions, setQueryStates],
  )

  const handleConfirmOldMillesime = useCallback(() => {
    if (pendingMillesimeRef.current) {
      setQueryStates({ millesime: pendingMillesimeRef.current })
      pendingMillesimeRef.current = null
    }
    warningModal.close()
  }, [setQueryStates])

  const handleCancelOldMillesime = useCallback(() => {
    pendingMillesimeRef.current = null
    if (activeVersion) {
      setQueryStates({ millesime: activeVersion.millesime })
    }
    warningModal.close()
  }, [activeVersion, setQueryStates])

  if (isLoading || !dataPackVersions) {
    return null
  }

  return (
    <>
      <Select
        label="Millésime des données"
        nativeSelectProps={{
          onChange: handleChange,
          value: queryStates.millesime || activeVersion?.millesime || '',
        }}
      >
        {dataPackVersions.map((dp) => (
          <option key={dp.millesime} value={dp.millesime}>
            {dp.label}
          </option>
        ))}
      </Select>

      <warningModal.Component
        title="Attention : pack de données ancien"
        concealingBackdrop
        buttons={[
          {
            children: 'Rester sur le millésime le plus à jour',
            priority: 'secondary',
            doClosesModal: false,
            onClick: handleCancelOldMillesime,
          },
          {
            children: 'Confirmer, je comprends les risques',
            doClosesModal: false,
            onClick: handleConfirmOldMillesime,
          },
        ]}
      >
        <p>
          Vous avez sélectionné un pack de données ancien. Ce n&apos;est pas le pack de données le plus à jour. Les résultats de votre
          simulation seront basés sur des données antérieures.
        </p>
      </warningModal.Component>
    </>
  )
}
