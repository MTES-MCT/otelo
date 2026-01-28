'use client'

import { fr } from '@codegouvfr/react-dsfr'
import Button from '@codegouvfr/react-dsfr/Button'
import { useRouter } from 'next/navigation'
import { FC } from 'react'
import { tss } from 'tss-react'
import { useStopImpersonation } from '~/hooks/use-impersonation'
import { useImpersonationStatus } from '~/hooks/use-impersonation-status'

export const ImpersonationBanner: FC = () => {
  const router = useRouter()
  const { data: impersonationStatus } = useImpersonationStatus()
  const { mutateAsync: stopImpersonation, isPending } = useStopImpersonation()
  const { classes } = useStyles()

  if (!impersonationStatus?.isImpersonating || !impersonationStatus?.impersonatedUser) {
    return null
  }

  const handleStopImpersonation = async () => {
    await stopImpersonation()
    router.push('/admin/gestion-des-utilisateurs')
  }

  return (
    <div className={classes.banner}>
      <div className={fr.cx('fr-container')}>
        <div className={classes.content}>
          <div className={classes.info}>
            <i className="ri-alert-line" />
            <span>
              <strong>Mode usurpation actif</strong> - Vous naviguez en tant que{' '}
              <strong>
                {impersonationStatus.impersonatedUser.firstname} {impersonationStatus.impersonatedUser.lastname}
              </strong>
              &nbsp; ({impersonationStatus.impersonatedUser.email})
            </span>
          </div>
          <Button size="small" iconId="ri-user-unfollow-line" onClick={handleStopImpersonation} disabled={isPending}>
            Revenir à l'administrateur
          </Button>
        </div>
      </div>
    </div>
  )
}

const useStyles = tss.create({
  banner: {
    backgroundColor: fr.colors.decisions.background.actionHigh.warning.default,
    borderBottom: `1px solid ${fr.colors.decisions.border.default.grey.default}`,
    color: fr.colors.decisions.text.inverted.grey.default,
    padding: fr.spacing('2v') + ' 0',
    position: 'sticky',
    top: 0,
    zIndex: 1000,
  },
  content: {
    alignItems: 'center',
    display: 'flex',
    gap: fr.spacing('4v'),
    justifyContent: 'space-between',
  },
  info: {
    alignItems: 'center',
    display: 'flex',
    gap: fr.spacing('2v'),
    '& i': {
      fontSize: '1.25rem',
    },
  },
})
