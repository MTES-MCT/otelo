'use client'

import { fr } from '@codegouvfr/react-dsfr'
import Button from '@codegouvfr/react-dsfr/Button'
import Input from '@codegouvfr/react-dsfr/Input'
import { createModal } from '@codegouvfr/react-dsfr/Modal'
import classNames from 'classnames'
import { useMemo, useState } from 'react'
import { Collaborator, useCollaborators, useInviteCollaborator, useRemoveCollaborator } from '~/hooks/use-collaborators'

interface ShareSimulationModalProps {
  simulationId: string
  simulationName: string
}

export function ShareSimulationModal({ simulationId, simulationName }: ShareSimulationModalProps) {
  const { collaborators, isLoading } = useCollaborators(simulationId)
  const { invite, isPending: isInviting } = useInviteCollaborator(simulationId)
  const { remove, isPending: isRemoving } = useRemoveCollaborator(simulationId)
  const [email, setEmail] = useState('')

  const modalActions = useMemo(
    () =>
      createModal({
        id: `share-simulation-modal-${simulationId}`,
        isOpenedByDefault: false,
      }),
    [simulationId],
  )

  const handleInvite = async () => {
    if (!email.trim()) return
    await invite(email.trim())
    setEmail('')
  }

  const handleRemove = async (collaborator: Collaborator) => {
    await remove(collaborator.userId)
  }

  return (
    <>
      <Button iconId="ri-share-line" onClick={modalActions.open} priority="tertiary" size="small">
        Partager
      </Button>

      <modalActions.Component title={`Partager "${simulationName}"`} concealingBackdrop>
        <p className={fr.cx('fr-text--sm', 'fr-mb-2w')}>
          Invitez des collaborateurs par email pour travailler ensemble sur cette simulation.
        </p>

        <form
          onSubmit={(e) => {
            e.preventDefault()
            handleInvite()
          }}
        >
          <div className="fr-flex fr-flex-gap-2v fr-align-items-end">
            <div className="fr-flex-grow-1">
              <Input
                label="Email du collaborateur"
                nativeInputProps={{
                  value: email,
                  onChange: (e) => setEmail(e.target.value),
                  placeholder: 'exemple@email.fr',
                  type: 'email',
                }}
              />
            </div>
            <div className={fr.cx('fr-mb-4v')}>
              <Button type="submit" disabled={isInviting || !email.trim()} iconId="ri-user-add-line" size="small">
                {isInviting ? 'Invitation...' : 'Inviter'}
              </Button>
            </div>
          </div>
        </form>

        {isLoading ? (
          <p className={fr.cx('fr-text--sm')}>Chargement...</p>
        ) : collaborators.length > 0 ? (
          <div className={fr.cx('fr-mt-2w')}>
            <h6 className={fr.cx('fr-mb-1w')}>Collaborateurs ({collaborators.length})</h6>
            <ul className={classNames('fr-raw-list', fr.cx('fr-mb-0'))}>
              {collaborators.map((collab) => (
                <li key={collab.id} className="fr-flex fr-justify-content-space-between fr-align-items-center fr-py-1v">
                  <div>
                    <span className={fr.cx('fr-text--bold')}>
                      {collab.user.firstname} {collab.user.lastname}
                    </span>
                    <br />
                    <span className={fr.cx('fr-text--sm')}>{collab.user.email}</span>
                  </div>
                  <Button
                    iconId="ri-close-line"
                    priority="tertiary no outline"
                    size="small"
                    title="Retirer ce collaborateur"
                    onClick={() => handleRemove(collab)}
                    disabled={isRemoving}
                  />
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <p className={fr.cx('fr-text--sm', 'fr-mt-2w')}>Aucun collaborateur pour le moment.</p>
        )}
      </modalActions.Component>
    </>
  )
}
