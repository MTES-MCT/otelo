'use client'

import Button from '@codegouvfr/react-dsfr/Button'
import { createModal } from '@codegouvfr/react-dsfr/Modal'
import Tooltip from '@codegouvfr/react-dsfr/Tooltip'
import { useRouter } from 'next/navigation'
import { useMemo } from 'react'
import { toast } from 'sonner'
import { useDeleteSimulation } from '~/hooks/use-delete-simulation'
import { TSimulationWithRelations } from '~/schemas/simulation'
import styles from './dashboard-simulation-item.module.css'

interface DeleteSimulationButtonProps {
  simulation: TSimulationWithRelations
}

export function DeleteSimulationButton({ simulation }: DeleteSimulationButtonProps) {
  const deleteSimulationMutation = useDeleteSimulation()
  const router = useRouter()

  const modalActions = useMemo(
    () =>
      createModal({
        id: `delete-simulation-modal-${simulation.id}`,
        isOpenedByDefault: false,
      }),
    [simulation.id],
  )

  const handleDeleteSimulation = () => {
    deleteSimulationMutation.mutate(simulation.id, {
      onSuccess: () => {
        modalActions.close()
        toast.success('Scénario supprimé avec succès.', {
          description: `Le scénario "${simulation.name}" a été définitivement supprimé.`,
        })
        router.refresh()
      },
      onError: () => {
        toast.error('Erreur lors de la suppression', {
          description: `Impossible de supprimer le scénario "${simulation.name}". Veuillez réessayer.`,
        })
      },
    })
  }

  return (
    <>
      <Tooltip title="Supprimer ce scénario">
        <Button
          iconId="ri-delete-bin-6-line"
          onClick={modalActions.open}
          priority="tertiary no outline"
          title="Cloner ce scénario"
          size="small"
        />
      </Tooltip>

      <modalActions.Component title="Êtes vous sûr de vouloir supprimer ce scénario ?" concealingBackdrop>
        <p>
          Cette action est irréversible. Le scénario <strong>"{simulation.name}"</strong> sera définitivement supprimé.
        </p>
        <div className={styles.modalActions}>
          <Button priority="secondary" onClick={modalActions.close}>
            Annuler
          </Button>
          <Button iconId="ri-delete-bin-6-line" onClick={handleDeleteSimulation} disabled={deleteSimulationMutation.isPending}>
            {deleteSimulationMutation.isPending ? 'Suppression...' : 'Supprimer'}
          </Button>
        </div>
      </modalActions.Component>
    </>
  )
}
