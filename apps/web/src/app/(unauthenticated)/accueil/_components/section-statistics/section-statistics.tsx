import { fr } from '@codegouvfr/react-dsfr'
import classNames from 'classnames'
import Link from 'next/link'
import { SURVEY_INFLUENCED_DOCUMENTS } from '~/constants/survey-statistics'
import { getPublicStatistics } from '~/server-only/statistics/get-public-statistics'
import { formatInteger, formatMonth, plural } from '~/utils/format-statistics'
import styles from './section-statistics.module.css'

type StatItemProps = {
  value: number
  singular: string
  pluralForm: string
}

function StatItem({ value, singular, pluralForm }: StatItemProps) {
  return (
    <div className={fr.cx('fr-col-12', 'fr-col-lg-4')}>
      <div className={styles.statItem}>
        <div className={styles.statValue}>{formatInteger(value)}</div>
        <p className={styles.statDescription}>
          <strong>{plural(value, singular, pluralForm)}</strong>
        </p>
      </div>
    </div>
  )
}

export async function SectionStatistics() {
  const statistics = await getPublicStatistics()
  const keyFigures = statistics?.keyFigures

  return (
    <section className={classNames(fr.cx('fr-py-16v'), styles.statisticsSection)}>
      <div className={fr.cx('fr-container')}>
        <h2 className={styles.statisticsTitle}>Une solution qui fait ses preuves</h2>

        <div className={fr.cx('fr-grid-row', 'fr-grid-row--gutters')}>
          <div className={fr.cx('fr-col-12', keyFigures ? 'fr-col-lg-4' : 'fr-col-lg-6')}>
            <div className={styles.statItem}>
              <div className={styles.statValue}>{SURVEY_INFLUENCED_DOCUMENTS.value}</div>
              <p className={styles.statDescription}>
                <strong>
                  {plural(SURVEY_INFLUENCED_DOCUMENTS.value, "document d'urbanisme influencé", "documents d'urbanisme influencés")}
                </strong>{' '}
                depuis {formatMonth(SURVEY_INFLUENCED_DOCUMENTS.since)}
              </p>
              <p className={styles.statDescription}>({SURVEY_INFLUENCED_DOCUMENTS.source})</p>
            </div>
          </div>

          {keyFigures && (
            <>
              <StatItem
                value={keyFigures.engagedLocalAuthorityAccounts}
                singular="collectivité utilisatrice"
                pluralForm="collectivités utilisatrices"
              />
              <StatItem value={keyFigures.epcisWithSimulation} singular="EPCI étudié avec Otelo" pluralForm="EPCI étudiés avec Otelo" />
            </>
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
