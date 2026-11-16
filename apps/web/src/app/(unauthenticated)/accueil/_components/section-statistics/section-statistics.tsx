import { fr } from '@codegouvfr/react-dsfr'
import classNames from 'classnames'
import Link from 'next/link'
import { SURVEY_INFLUENCED_DOCUMENTS } from '~/constants/survey-statistics'
import { getPublicStatistics } from '~/server-only/statistics/get-public-statistics'
import { formatInteger, plural } from '../../../statistiques/_components/format'
import styles from './section-statistics.module.css'

export async function SectionStatistics() {
  const statistics = await getPublicStatistics()
  const epcisWithExport = statistics?.keyFigures.epcisWithExport

  return (
    <section className={classNames(fr.cx('fr-py-16v'), styles.statisticsSection)}>
      <div className={fr.cx('fr-container')}>
        <h2 className={styles.statisticsTitle}>Une solution qui fait ses preuves</h2>

        <div className={fr.cx('fr-grid-row', 'fr-grid-row--gutters')}>
          <div className={fr.cx('fr-col-12', 'fr-col-lg-6')}>
            <div className={styles.statItem}>
              <div className={styles.statValue}>{SURVEY_INFLUENCED_DOCUMENTS.value}</div>
              <p className={styles.statDescription}>
                <strong>
                  {plural(SURVEY_INFLUENCED_DOCUMENTS.value, "document d'urbanisme influencé", "documents d'urbanisme influencés")}
                </strong>{' '}
                depuis le 1er janvier 2025
              </p>
              <p className={styles.statDescription}>({SURVEY_INFLUENCED_DOCUMENTS.source})</p>
            </div>
          </div>

          {epcisWithExport !== undefined && (
            <div className={fr.cx('fr-col-12', 'fr-col-lg-6')}>
              <div className={styles.statItem}>
                <div className={styles.statValue}>{formatInteger(epcisWithExport)}</div>
                <p className={styles.statDescription}>{plural(epcisWithExport, 'EPCI utilisateur', 'EPCI utilisateurs')}</p>
              </div>
            </div>
          )}
        </div>

        <div className={styles.linkContainer}>
          <Link href="/statistiques" className={fr.cx('fr-link')}>
            Voir plus de statistiques
          </Link>
        </div>
      </div>
    </section>
  )
}
