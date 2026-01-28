import { fr } from '@codegouvfr/react-dsfr'
import Button from '@codegouvfr/react-dsfr/Button'
import CallOut from '@codegouvfr/react-dsfr/CallOut'
import classNames from 'classnames'
import { CONTACT_EMAIL, QUIZ_URL, WEBINAIRE_URL } from '~/utils/resources'
import styles from './layout.module.css'

export default function GenericPagesLayout({ children, summary }: { children: React.ReactNode; summary: React.ReactNode }) {
  return (
    <div className={fr.cx('fr-container')}>
      <div className={fr.cx('fr-grid-row', 'fr-grid-row--gutters')}>
        <div className={classNames(fr.cx('fr-col-12', 'fr-col-md-4'), styles.sideMenuContainer)}>
          <div className={classNames(styles.ctaContainer, styles.padRight)}>
            <Button
              priority="tertiary"
              className={styles.button}
              linkProps={{ href: WEBINAIRE_URL, target: '_blank', rel: 'noopener noreferrer' }}
            >
              S'inscrire à une formation Otelo
            </Button>
            <Button
              priority="tertiary"
              className={styles.button}
              linkProps={{ href: QUIZ_URL, target: '_blank', rel: 'noopener noreferrer' }}
            >
              Testez vos connaissances
            </Button>
          </div>

          <div className={styles.padRight}>
            <CallOut>
              Contactez l’équipe Otelo à l’adresse : <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
            </CallOut>
          </div>

          {summary}
        </div>
        <div className={fr.cx('fr-col-12', 'fr-col-md-8')}>{children}</div>
      </div>
    </div>
  )
}
