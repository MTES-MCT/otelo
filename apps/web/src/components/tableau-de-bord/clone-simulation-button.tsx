'use client'

import { fr } from '@codegouvfr/react-dsfr'
import Button from '@codegouvfr/react-dsfr/Button'
import Input from '@codegouvfr/react-dsfr/Input'
import { createModal } from '@codegouvfr/react-dsfr/Modal'
import Tooltip from '@codegouvfr/react-dsfr/Tooltip'
import classNames from 'classnames'
import { useRouter } from 'next/navigation'
import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import { useCloneSimulation } from '~/hooks/use-clone-simulation'
import { TSimulationWithRelations } from '~/schemas/simulation'
import styles from './dashboard-simulation-item.module.css'

interface CloneSimulationButtonProps {
  simulation: TSimulationWithRelations
}

export function CloneSimulationButton({ simulation }: CloneSimulationButtonProps) {
  const cloneSimulationMutation = useCloneSimulation()
  const router = useRouter()
  const [cloneName, setCloneName] = useState(`${simulation.name} - Copie`)

  const modalActions = useMemo(
    () =>
      createModal({
        id: `clone-simulation-modal-${simulation.id}`,
        isOpenedByDefault: false,
      }),
    [simulation.id],
  )

  const handleCloneSimulation = () => {
    if (!cloneName.trim()) {
      toast.error('Le nom est requis')
      return
    }

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
          setCloneName(`${simulation.name} - Copie`) // Reset for next time
        },
        onError: () => {
          toast.error('Erreur lors du clonage', {
            description: `Impossible de cloner le scénario "${simulation.name}". Veuillez réessayer.`,
          })
        },
      },
    )
  }

  const handleModalOpen = () => {
    setCloneName(`${simulation.name} - Copie`)
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
            Créer une copie du scénario <strong>"{simulation.name}"</strong> avec un nouveau nom.
          </p>

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
            <Button iconId="ri-file-copy-line" type="submit" disabled={cloneSimulationMutation.isPending || !cloneName.trim()}>
              {cloneSimulationMutation.isPending ? 'Clonage...' : 'Cloner'}
            </Button>
          </div>
        </form>
      </modalActions.Component>
    </>
  )
}
