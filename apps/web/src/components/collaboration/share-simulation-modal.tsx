'use client'

import { fr } from '@codegouvfr/react-dsfr'
import Button from '@codegouvfr/react-dsfr/Button'
import Input from '@codegouvfr/react-dsfr/Input'
import { createModal } from '@codegouvfr/react-dsfr/Modal'
import ToggleSwitch from '@codegouvfr/react-dsfr/ToggleSwitch'
import { useMemo } from 'react'
import { toast } from 'sonner'
import { useShareStatus, useToggleShare } from '~/hooks/use-share-link'
import { useTracking } from '~/hooks/use-tracking'

interface ShareSimulationModalProps {
  simulationId: string
  simulationName: string
}

export function ShareSimulationModal({ simulationId, simulationName }: ShareSimulationModalProps) {
  const { data: shareStatus, isLoading } = useShareStatus(simulationId)
  const { mutate: toggleShare, isPending } = useToggleShare(simulationId)
  const { trackEvent } = useTracking()

  const modalActions = useMemo(
    () =>
      createModal({
        id: `share-simulation-modal-${simulationId}`,
        isOpenedByDefault: false,
      }),
    [simulationId],
  )

  const shareUrl = shareStatus?.token ? `${window.location.origin}/partage/${shareStatus.token}` : ''

  const handleCopyLink = async () => {
    await navigator.clipboard.writeText(shareUrl)
    // P2 — le volume de partages activés se mesure en base ; cet événement dit
    // combien de personnes vont jusqu'à réellement diffuser le lien.
    trackEvent({ action: 'copie lien', category: 'Partage' })
    toast.success('Lien copié dans le presse-papiers')
  }

  // P1 — l'activation elle-même est journalisée en base ; l'événement permet de la
  // situer dans le parcours (depuis quelle page, après quelle action).
  const handleToggleShare = () => {
    trackEvent({
      action: shareStatus?.active ? 'desactivation partage' : 'activation partage',
      category: 'Partage',
    })
    toggleShare()
  }

  return (
    <>
      <Button iconId="ri-share-line" onClick={modalActions.open} priority="tertiary" size="small">
        Partager
      </Button>

      <modalActions.Component title={`Partager "${simulationName}"`} concealingBackdrop>
        <p className={fr.cx('fr-text--sm', 'fr-mb-2w')}>
          Activez le partage pour générer un lien permettant à toute personne d'accéder aux résultats en lecture seule.
        </p>

        {isLoading ? (
          <p className={fr.cx('fr-text--sm')}>Chargement...</p>
        ) : (
          <>
            <ToggleSwitch
              label="Activer le partage"
              checked={shareStatus?.active ?? false}
              onChange={handleToggleShare}
              disabled={isPending}
            />

            {shareStatus?.active && shareStatus.token && (
              <div className={fr.cx('fr-mt-2w')}>
                <div className="fr-flex fr-flex-gap-2v fr-align-items-end fr-justify-content-end">
                  <div className="fr-flex-grow-1">
                    <Input
                      label="Lien de partage"
                      nativeInputProps={{
                        value: shareUrl,
                        readOnly: true,
                      }}
                    />
                  </div>
                  <div>
                    <Button iconId="ri-clipboard-line" onClick={handleCopyLink}>
                      Copier le lien
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </modalActions.Component>
    </>
  )
}
