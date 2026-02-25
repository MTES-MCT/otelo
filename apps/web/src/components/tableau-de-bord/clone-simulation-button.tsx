'use client'

import { fr } from '@codegouvfr/react-dsfr'
import Alert from '@codegouvfr/react-dsfr/Alert'
import Button from '@codegouvfr/react-dsfr/Button'
import Input from '@codegouvfr/react-dsfr/Input'
import { createModal } from '@codegouvfr/react-dsfr/Modal'
import { Select } from '@codegouvfr/react-dsfr/Select'
import Tooltip from '@codegouvfr/react-dsfr/Tooltip'
import classNames from 'classnames'
import { useRouter } from 'next/navigation'
import { useCallback, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { useActualizeSimulation } from '~/hooks/use-actualize-simulation'
import { useCloneSimulation } from '~/hooks/use-clone-simulation'
import { useDataPackVersions } from '~/hooks/use-data-pack-versions'
import { TSimulationWithRelations } from '~/schemas/simulation'
import styles from './dashboard-simulation-item.module.css'

interface CloneSimulationButtonProps {
  simulation: TSimulationWithRelations
}

export function CloneSimulationButton({ simulation }: CloneSimulationButtonProps) {
  const cloneSimulationMutation = useCloneSimulation()
  const actualizeSimulationMutation = useActualizeSimulation()
  const router = useRouter()
  const { data: dataPackVersions } = useDataPackVersions()

  const sourceMillesime = simulation.scenario.millesime
  const activeVersion = dataPackVersions?.find((dp) => dp.isActive)

  const [selectedMillesime, setSelectedMillesime] = useState(sourceMillesime || activeVersion?.millesime || '')
  const [cloneName, setCloneName] = useState(`${simulation.name} - Copie`)

  const isMillesimeChanged = selectedMillesime && selectedMillesime !== sourceMillesime
  const isNonActiveMillesime = selectedMillesime && !dataPackVersions?.find((dp) => dp.millesime === selectedMillesime)?.isActive

  const isPending = cloneSimulationMutation.isPending || actualizeSimulationMutation.isPending

  const modalActions = useMemo(
    () =>
      createModal({
        id: `clone-simulation-modal-${simulation.id}`,
        isOpenedByDefault: false,
      }),
    [simulation.id],
  )

  const handleMillesimeChange = useCallback(
    (event: React.ChangeEvent<HTMLSelectElement>) => {
      const newMillesime = event.target.value
      setSelectedMillesime(newMillesime)

      if (newMillesime !== sourceMillesime) {
        setCloneName(`${simulation.name} (millésime ${newMillesime})`)
      } else {
        setCloneName(`${simulation.name} - Copie`)
      }
    },
    [simulation.name, sourceMillesime],
  )

  const handleCloneSimulation = () => {
    if (!cloneName.trim()) {
      toast.error('Le nom est requis')
      return
    }

    if (isMillesimeChanged) {
      // Use actualize for different millesime
      actualizeSimulationMutation.mutate(
        {
          simulationId: simulation.id,
          data: { millesime: selectedMillesime, name: cloneName.trim() },
        },
        {
          onSuccess: () => {
            modalActions.close()
            toast.success('Scénario actualisé avec succès.', {
              description: `Le scénario "${cloneName}" a été créé avec le millésime ${selectedMillesime}.`,
            })
            router.refresh()
            resetForm()
          },
          onError: () => {
            toast.error("Erreur lors de l'actualisation", {
              description: `Impossible d'actualiser le scénario "${simulation.name}". Veuillez réessayer.`,
            })
          },
        },
      )
    } else {
      // Use simple clone for same millesime
      cloneSimulationMutation.mutate(
        {
          simulationId: simulation.id,
          data: { name: cloneName.trim() },
        },
        {
          onSuccess: () => {
            modalActions.close()
            toast.success('Scénario cloné avec succès.', {
              description: `Le scénario "${cloneName}" a été créé à partir de "${simulation.name}".`,
            })
            router.refresh()
            resetForm()
          },
          onError: () => {
            toast.error('Erreur lors du clonage', {
              description: `Impossible de cloner le scénario "${simulation.name}". Veuillez réessayer.`,
            })
          },
        },
      )
    }
  }

  const resetForm = () => {
    setCloneName(`${simulation.name} - Copie`)
    setSelectedMillesime(sourceMillesime || activeVersion?.millesime || '')
  }

  const handleModalOpen = () => {
    resetForm()
    modalActions.open()
  }

  return (
    <>
      <Tooltip title="Cloner ce scénario">
        <Button
          iconId="ri-file-copy-line"
          onClick={handleModalOpen}
          priority="tertiary no outline"
          title="Cloner ce scénario"
          size="small"
        />
      </Tooltip>

      <modalActions.Component title="Cloner le scénario" concealingBackdrop>
        <form
          onSubmit={(e) => {
            e.preventDefault()
            if (cloneName.trim()) {
              handleCloneSimulation()
            }
          }}
        >
          <p>
            Créer une copie du scénario <strong>&quot;{simulation.name}&quot;</strong> avec un nouveau nom.
          </p>

          {dataPackVersions && dataPackVersions.length > 1 && (
            <>
              <Select
                label="Millésime"
                nativeSelectProps={{
                  onChange: handleMillesimeChange,
                  value: selectedMillesime,
                }}
              >
                {dataPackVersions.map((dp) => (
                  <option key={dp.millesime} value={dp.millesime}>
                    {dp.label}
                  </option>
                ))}
              </Select>

              {isNonActiveMillesime && (
                <Alert
                  severity="warning"
                  small
                  description="Ce n'est pas le pack de données le plus à jour. Les résultats seront basés sur des données antérieures."
                  className={fr.cx('fr-mb-2w')}
                />
              )}
            </>
          )}

          <Input
            label="Nom du nouveau scénario"
            nativeInputProps={{
              value: cloneName,
              onChange: (e) => setCloneName(e.target.value),
              onKeyDown: (e) => {
                if (e.key === 'Enter' && cloneName.trim()) {
                  e.preventDefault()
                  handleCloneSimulation()
                }
              },
              placeholder: 'Nom du scénario cloné',
              maxLength: 100,
              autoFocus: true,
            }}
            state={cloneName.trim() ? 'default' : 'error'}
            stateRelatedMessage={cloneName.trim() ? undefined : 'Le nom est requis'}
          />

          <div className={classNames(fr.cx('fr-mt-2w'), styles.modalActions)}>
            <Button priority="secondary" type="button" onClick={modalActions.close}>
              Annuler
            </Button>
            <Button iconId="ri-file-copy-line" type="submit" disabled={isPending || !cloneName.trim()}>
              {isPending ? 'Clonage...' : isMillesimeChanged ? 'Actualiser' : 'Cloner'}
            </Button>
          </div>
        </form>
      </modalActions.Component>
    </>
  )
}
