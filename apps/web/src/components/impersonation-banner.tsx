'use client'

import { fr } from '@codegouvfr/react-dsfr'
import Button from '@codegouvfr/react-dsfr/Button'
import { FC } from 'react'
import { tss } from 'tss-react'
import { useStopImpersonation } from '~/hooks/use-impersonation'
import { useSession } from '~/lib/auth/client'

export const ImpersonationBanner: FC = () => {
  const { data: session } = useSession()
  const { stopImpersonation, isPending } = useStopImpersonation()
  const { classes } = useStyles()

  const isImpersonating = !!session?.session?.impersonatedBy
  const user = session?.user

  if (!isImpersonating || !user) {
    return null
  }

  const handleStopImpersonation = () => stopImpersonation()

  return (
    <div className={classes.banner}>
      <div className={fr.cx('fr-container')}>
        <div className={classes.content}>
          <div className={classes.info}>
            <i className="ri-alert-line" />
            <span>
              <strong>Mode usurpation actif</strong> - Vous naviguez en tant que{' '}
              <strong>
                {user.firstname} {user.lastname}
              </strong>
              &nbsp; ({user.email})
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
