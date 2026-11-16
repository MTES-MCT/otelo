import type { TPublicStatistics } from '@otelo/shared'
import type { ReactNode } from 'react'
import { SURVEY_INFLUENCED_DOCUMENTS } from '~/constants/survey-statistics'
import { formatInteger, formatMonth, formatPopulation, plural } from '~/utils/format-statistics'
import styles from '../statistiques.module.css'
import { formatDecimal } from './format'

type FigureProps = {
  value: string
  label: string
  children?: ReactNode
}

function Figure({ value, label, children }: FigureProps) {
  return (
    <div className={styles.figure}>
      <p className={styles.figureValue}>{value}</p>
      <p className={styles.figureLabel}>{label}</p>
      {children}
    </div>
  )
}

/** Chiffre d'enquête, affiché aussi quand les statistiques calculées sont indisponibles. */
export function SurveyFigure() {
  const { value, since } = SURVEY_INFLUENCED_DOCUMENTS
  return (
    <Figure value={formatInteger(value)} label={plural(value, "Document d'urbanisme influencé", "Documents d'urbanisme influencés")}>
      <p className={styles.figureDetail}>
        Déclaratif, d'après l'enquête de l'équipe auprès des utilisateurs formés, depuis {formatMonth(since)}.
      </p>
    </Figure>
  )
}

export function KeyFigures({ keyFigures }: { keyFigures: TPublicStatistics['keyFigures'] }) {
  const {
    epcisWithExport,
    epcisWithSimulation,
    coveredPopulation,
    coveredPopulationShare,
    planningDocuments,
    engagedDepartments,
    totalDepartments,
    engagedLocalAuthorityAccounts,
  } = keyFigures

  return (
    <ul className={styles.figures}>
      <li>
        <Figure
          value={formatInteger(engagedLocalAuthorityAccounts)}
          label={plural(engagedLocalAuthorityAccounts, 'Collectivité utilisatrice', 'Collectivités utilisatrices')}
        >
          <p className={styles.figureDetail}>Comptes ouverts par des EPCI, communes, syndicats de SCoT et autres collectivités.</p>
        </Figure>
      </li>
      <li>
        <Figure
          value={formatInteger(epcisWithSimulation)}
          label={plural(epcisWithSimulation, 'EPCI étudié avec Otelo', 'EPCI étudiés avec Otelo')}
        >
          <p className={styles.figureDetail}>
            Présents dans au moins une simulation, quel qu'en soit l'auteur, dont {formatInteger(epcisWithExport)}{' '}
            {plural(epcisWithExport, 'couvert', 'couverts')} par un scénario exporté en PowerPoint.
          </p>
        </Figure>
      </li>
      <li>
        <Figure value={formatPopulation(coveredPopulation)} label="Habitants couverts">
          <p className={styles.figureDetail}>
            {formatInteger(coveredPopulation)} {plural(coveredPopulation, 'habitant', 'habitants')}, soit{' '}
            {formatDecimal(coveredPopulationShare)} % de la population des EPCI de France, dans les EPCI couverts par un scénario exporté en
            PowerPoint.
          </p>
        </Figure>
      </li>
      <li>
        <Figure
          value={formatInteger(planningDocuments)}
          label={plural(
            planningDocuments,
            "Dossier d'études pour un document d'urbanisme",
            "Dossiers d'études pour un document d'urbanisme",
          )}
        >
          <p className={styles.figureDetail}>
            PLH, PLUi-H, SCoT ou autre document déclaré, avec au moins un scénario exporté en PowerPoint.
          </p>
        </Figure>
      </li>
      <li>
        <SurveyFigure />
      </li>
      {totalDepartments > 0 && (
        <li>
          <Figure
            value={`${formatInteger(engagedDepartments)} / ${formatInteger(totalDepartments)}`}
            label="Départements où la DDT est engagée"
          >
            <p className={styles.figureDetail}>Départements d'au moins un EPCI sur lequel une DDT a lancé une simulation.</p>
          </Figure>
        </li>
      )}
    </ul>
  )
}
