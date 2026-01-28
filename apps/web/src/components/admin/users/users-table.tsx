'use client'

import { fr } from '@codegouvfr/react-dsfr'
import Button from '@codegouvfr/react-dsfr/Button'
import { createModal } from '@codegouvfr/react-dsfr/Modal'
import Select from '@codegouvfr/react-dsfr/Select'
import dayjs from 'dayjs'
import { useQueryState } from 'nuqs'
import { FC } from 'react'
import { tss } from 'tss-react'
import { useDeleteUser } from '~/hooks/use-delete-user'
import { useStartImpersonation } from '~/hooks/use-impersonation'
import { useSearchUsers } from '~/hooks/use-search-users'
import { useUpdateUserAccess } from '~/hooks/use-update-user-access'
import { useUsers } from '~/hooks/use-users'

export const UsersTable: FC = () => {
  const { classes, cx } = useStyles()
  const { data: usersResponse } = useUsers()
  const { data: usersSearchResponse } = useSearchUsers()
  const { mutate: updateUserAccess, isPending } = useUpdateUserAccess()
  const { mutate: deleteUser } = useDeleteUser()
  const { mutateAsync: startImpersonation } = useStartImpersonation()
  const [searchQuery] = useQueryState('q')

  const headers = [
    'Nom et Prénom',
    'Email',
    'Role',
    'Date de création',
    'Date de dernière connexion',
    'Accès',
    'Démarches simplifiées',
    'Actions',
  ]
  const data = searchQuery ? usersSearchResponse?.users : usersResponse?.users

  const userModals = (data || []).map((user) => {
    const modalActions = createModal({
      id: `delete-user-modal-${user.id}`,
      isOpenedByDefault: false,
    })

    return {
      handleDeleteUser: async () => {
        await deleteUser(user.id)
        modalActions.close()
      },
      handleImpersonateUser: async () => {
        await startImpersonation({ userId: user.id })
      },
      modalActions,
      user,
    }
  })

  return (
    <>
      <div className={fr.cx('fr-table')}>
        <table style={{ display: 'table' }}>
          <thead>
            <tr>
              {headers.map((h) => (
                <th key={h}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {userModals.map(({ modalActions, user, handleImpersonateUser }) => (
              <tr key={user.id}>
                <td className={classes.nameCell}>{`${user.firstname} ${user.lastname}`}</td>
                <td className={classes.emailCell}>{user.email}</td>
                <td>
                  <div className={cx(fr.cx('fr-badge'), user.role === 'ADMIN' ? classes.adminBadge : classes.userBadge)}>{user.role}</div>
                </td>
                <td>{dayjs(user.createdAt).format('DD/MM/YYYY')}</td>
                <td>{dayjs(user.lastLoginAt).format('DD/MM/YYYY - HH:mm')}</td>
                <td>
                  {user.role === 'USER' ? (
                    <Select
                      label=""
                      nativeSelectProps={{
                        value: user.hasAccess ? 'authorized' : 'unauthorized',
                        onChange: (e) => {
                          const newAccess = e.target.value === 'authorized'
                          updateUserAccess({ userId: user.id, hasAccess: newAccess })
                        },
                        disabled: isPending,
                      }}
                      className={classes.accessSelect}
                    >
                      <option value="authorized">✅ Autorisé</option>
                      <option value="unauthorized">❌ Non autorisé</option>
                    </Select>
                  ) : (
                    <div className={cx(fr.cx('fr-badge'), user.role === 'ADMIN' ? classes.adminBadge : classes.userBadge)}>{user.role}</div>
                  )}
                </td>
                <td>
                  {user.role === 'USER' ? (
                    user.engaged ? (
                      '✅'
                    ) : (
                      '❌'
                    )
                  ) : (
                    <div className={cx(fr.cx('fr-badge'), user.role === 'ADMIN' ? classes.adminBadge : classes.userBadge)}>{user.role}</div>
                  )}
                </td>

                <td>
                  <div className={classes.actions}>
                    {user.role === 'USER' && (
                      <i
                        style={{ cursor: 'pointer' }}
                        onClick={handleImpersonateUser}
                        className="ri-user-follow-line"
                        title="Usurper cet utilisateur"
                      />
                    )}
                    <i style={{ cursor: 'pointer' }} onClick={modalActions.open} className="ri-delete-bin-5-fill" />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {userModals.map(({ handleDeleteUser, modalActions, user }) => (
        <modalActions.Component key={user.id} title="Êtes vous sûr de vouloir supprimer cet utilisateur ?">
          <p>Cette action est irréversible. L&apos;utilisateur perd ses droits et ses accès à Otelo.</p>
          <div className={classes.actionsModalCtasContainer}>
            <Button priority="secondary" onClick={modalActions.close}>
              Annuler
            </Button>
            <Button className={classes.deleteCta} iconId="ri-delete-bin-5-fill" onClick={handleDeleteUser}>
              Supprimer
            </Button>
          </div>
        </modalActions.Component>
      ))}
    </>
  )
}

const useStyles = tss.create({
  nameCell: {
    maxWidth: '180px',
  },
  emailCell: {
    maxWidth: '250px',
  },
  accessSelect: {
    marginBottom: '0 !important',
    minWidth: '160px',
  },
  actions: {
    color: fr.colors.decisions.text.actionHigh.blueFrance.default,
    display: 'flex',
    gap: '0.5rem',
  },
  actionsModalCtasContainer: {
    display: 'flex',
    gap: '0.5rem',
    justifyContent: 'flex-end',
  },
  adminBadge: {
    backgroundColor: fr.colors.decisions.background.actionLow.purpleGlycine.default,
    color: fr.colors.decisions.text.actionHigh.purpleGlycine.default,
  },
  deleteCta: {
    '&:hover': {
      backgroundColor: `${fr.colors.decisions.background.actionHigh.redMarianne.default} !important`,
    },
    backgroundColor: fr.colors.decisions.background.actionLow.redMarianne.default,
    color: fr.colors.decisions.background.default.grey.default,
  },
  userBadge: {
    backgroundColor: fr.colors.decisions.background.actionLow.blueCumulus.default,
    color: fr.colors.decisions.text.actionHigh.blueCumulus.default,
  },
})
