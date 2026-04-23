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
import { useRenameSimulation } from '~/hooks/use-rename-simulation'
import { TSimulationWithRelations } from '~/schemas/simulation'
import styles from './dashboard-simulation-item.module.css'

interface RenameSimulationButtonProps {
  simulation: TSimulationWithRelations
}

export function RenameSimulationButton({ simulation }: RenameSimulationButtonProps) {
  const renameSimulationMutation = useRenameSimulation()
  const router = useRouter()

  const [name, setName] = useState(simulation.name)

  const modalActions = useMemo(
    () =>
      createModal({
        id: `rename-simulation-modal-${simulation.id}`,
        isOpenedByDefault: false,
      }),
    [simulation.id],
  )

  const handleRename = () => {
    const trimmed = name.trim()
    if (!trimmed) {
      toast.error('Le nom est requis')
      return
    }

    if (trimmed === simulation.name) {
      modalActions.close()
      return
    }

    renameSimulationMutation.mutate(
      { simulationId: simulation.id, name: trimmed },
      {
        onSuccess: () => {
          modalActions.close()
          toast.success('Scénario renommé avec succès.', {
            description: `Le scénario s'appelle désormais "${trimmed}".`,
          })
          router.refresh()
        },
        onError: () => {
          toast.error('Erreur lors du renommage', {
            description: `Impossible de renommer le scénario "${simulation.name}". Veuillez réessayer.`,
          })
        },
      },
    )
  }

  const handleModalOpen = () => {
    setName(simulation.name)
    modalActions.open()
  }

  return (
    <>
      <Tooltip title="Modifier le nom du scénario">
        <Button
          iconId="ri-pencil-line"
          onClick={handleModalOpen}
          priority="tertiary no outline"
          title="Modifier le nom du scénario"
          size="small"
        />
      </Tooltip>

      <modalActions.Component title="Comment souhaitez-vous nommer ce scénario ?" concealingBackdrop>
        <form
          onSubmit={(e) => {
            e.preventDefault()
            handleRename()
          }}
        >
          <Input
            label="Nom du scénario"
            nativeInputProps={{
              value: name,
              onChange: (e) => setName(e.target.value),
              onKeyDown: (e) => {
                if (e.key === 'Enter' && name.trim()) {
                  e.preventDefault()
                  handleRename()
                }
              },
              placeholder: 'Saisissez le nom de votre scénario',
              maxLength: 100,
              autoFocus: true,
            }}
            state={name.trim() ? 'default' : 'error'}
            stateRelatedMessage={name.trim() ? undefined : 'Le nom est requis'}
          />

          <div className={classNames(fr.cx('fr-mt-2w'), styles.modalActions)}>
            <Button priority="secondary" type="button" onClick={modalActions.close}>
              Annuler
            </Button>
            <Button type="submit" disabled={renameSimulationMutation.isPending || !name.trim()}>
              {renameSimulationMutation.isPending ? 'Enregistrement...' : 'Enregistrer'}
            </Button>
          </div>
        </form>
      </modalActions.Component>
    </>
  )
}
