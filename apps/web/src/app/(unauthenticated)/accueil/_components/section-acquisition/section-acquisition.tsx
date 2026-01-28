import { fr } from '@codegouvfr/react-dsfr'
import { Button } from '@codegouvfr/react-dsfr/Button'
import classNames from 'classnames'
import { QUIZ_URL, WEBINAIRE_URL } from '~/utils/resources'
import styles from './section-acquisition.module.css'

export const SectionAcquisition = () => {
  return (
    <section className={classNames(styles.section)}>
      <div className={fr.cx('fr-container')}>
        <div className={classNames(fr.cx('fr-grid-row'), styles.row)}>
          <div className={classNames(fr.cx('fr-col-12', 'fr-col-md-6'), styles.center)}>
            <p className={classNames(fr.cx('fr-mb-3w'), styles.text)}>
              Formez-vous à l'outil Otelo grâce à nos
              <br /> webinaires (sur inscription)
            </p>
            <Button
              priority="primary"
              className={styles.button}
              size="large"
              linkProps={{ href: WEBINAIRE_URL, target: '_blank', rel: 'noreferrer' }}
            >
              S'inscrire à une formation
            </Button>
          </div>

          <div className={classNames(fr.cx('fr-col-12', 'fr-col-md-6'), styles.center)}>
            <div>
              <p className={classNames(fr.cx('fr-mb-3w'), styles.text)}>
                Testez vos connaissances <br />
                en urbanisme
              </p>
              <Button
                priority="secondary"
                className={styles.button}
                size="large"
                linkProps={{ href: QUIZ_URL, target: '_blank', rel: 'noreferrer' }}
              >
                Faire le test
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
