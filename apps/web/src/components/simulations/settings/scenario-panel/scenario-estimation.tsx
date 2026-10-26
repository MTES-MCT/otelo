'use client'

import { Select } from '@codegouvfr/react-dsfr/Select'
import { ALL_EPCIS_KEY, EstimationBreakdown } from '@otelo/shared'
import classNames from 'classnames'
import { FC } from 'react'
import { useWizardStep } from '../use-wizard-step'
import styles from './scenario-panel.module.css'
import { ScenarioSectionBlock } from './scenario-section-block'
import { buildScenarioSections, type ScenarioRowDetail } from './scenario-sections'

/** Hypothèses rappelées sous les lignes de l'estimation ; `null` quand elles ne s'appliquent pas. */
export type ScenarioRowDetails = Record<ScenarioRowDetail, string | null>

const POPULATION_LABELS: Record<string, string> = { Central: 'Centrale', PB: 'Basse', PH: 'Haute' }
const HOUSEHOLDS_LABELS: Record<string, string> = { B: 'Décélération', C: 'Tendanciel', H: 'Accéléré' }

/** « Central_H » → « Centrale – Accéléré » : le scénario de population, puis celui de ménages. */
export const getDemographicScenarioLabel = (omphale: string | null | undefined): string | null => {
  const [population, households] = omphale?.split('_') ?? []
  const populationLabel = population ? POPULATION_LABELS[population] : undefined
  const householdsLabel = households ? HOUSEHOLDS_LABELS[households] : undefined
  return populationLabel && householdsLabel ? `${populationLabel} – ${householdsLabel}` : null
}

const formatTargetRate = (rate: number | null | undefined): string | null =>
  rate == null ? null : `Taux cible : ${(rate * 100).toFixed(2).replace('.', ',')} %`

/**
 * Taux cibles d'un seul EPCI : sur l'ensemble du territoire, chaque EPCI garde le sien.
 * La création porte le taux de résidences secondaires en `txRS`, la modification en `txRs`.
 */
export const buildScenarioRowDetails = (
  omphale: string | null | undefined,
  rates: { longTermVacancyRate?: number; txRS?: number; txRs?: number } | null | undefined,
): ScenarioRowDetails => ({
  demographicScenario: getDemographicScenarioLabel(omphale),
  longTermVacancyRate: formatTargetRate(rates?.longTermVacancyRate),
  secondaryResidenceRate: formatTargetRate(rates?.txRS ?? rates?.txRs),
})

type ScenarioEstimationProps = {
  /** `null` tant que la projection démographique n'est pas choisie : on dit ce qui manque. */
  breakdown: EstimationBreakdown | null
  /** Un recalcul est en cours : on garde la dernière valeur connue, en la grisant. */
  isStale: boolean
  /** Sans options, l'estimation reste sur l'agrégat et le sélecteur de portée n'apparaît pas. */
  epciOptions: Array<{ code: string; name: string }>
  /** EPCI auquel l'estimation est restreinte, ou `null` pour l'ensemble du territoire. */
  scopedEpciCode: string | null
  onScopeChange: (epciCode: string | null) => void
  /** Le moteur écarte cet EPCI du total : ses termes valent tous zéro, il faut le dire. */
  isScopedEpciExcluded?: boolean
  rowDetails: ScenarioRowDetails
}

export const ScenarioEstimation: FC<ScenarioEstimationProps> = ({
  breakdown,
  isStale,
  epciOptions,
  scopedEpciCode,
  onScopeChange,
  isScopedEpciExcluded,
  rowDetails,
}) => {
  const { currentIndex, currentStep, flow, steps } = useWizardStep()

  const scopeSelector = epciOptions.length > 1 && (
    <Select
      className={styles.scopeSelect}
      label="Afficher les résultats pour"
      nativeSelectProps={{
        value: scopedEpciCode ?? ALL_EPCIS_KEY,
        onChange: (event) => onScopeChange(event.target.value === ALL_EPCIS_KEY ? null : event.target.value),
      }}
    >
      <option value={ALL_EPCIS_KEY}>L'ensemble du territoire</option>
      {epciOptions.map((epci) => (
        <option key={epci.code} value={epci.code}>
          {epci.name}
        </option>
      ))}
    </Select>
  )

  const renderMessage = (message: string) => (
    <>
      {scopeSelector}
      <p className="fr-text--sm fr-text-mention--grey fr-mb-0">{message}</p>
    </>
  )

  // Un paramétrage démographique non fait ne vaut pas une estimation à zéro : on annonce ce qui manque.
  if (!breakdown) {
    return renderMessage('Choisissez une projection de population puis de ménages pour afficher votre estimation.')
  }

  // Même principe pour un EPCI que le moteur écarte : une colonne de zéros se lirait comme une
  // absence de besoin plutôt que comme une exclusion du calcul.
  if (isScopedEpciExcluded) {
    return renderMessage("Cet EPCI n'a pas de besoin en constructions neuves sur la période : il est écarté du total du territoire.")
  }

  const currentSlug = currentStep?.slug
  const sections = buildScenarioSections(breakdown, { currentSlug, flow, isPastLastStep: currentIndex === steps.length })
  const hasFootnote = sections.some((section) => section.rows.some((row) => row.footnote && row.value !== null))

  return (
    <>
      {scopeSelector}
      <div className={classNames(styles.sections, { [styles.stale]: isStale })} aria-busy={isStale}>
        {sections.map((section) => (
          <ScenarioSectionBlock
            // Remonté à chaque étape : le bloc en cours de paramétrage s'ouvre de lui-même.
            key={`${section.key}-${currentSlug}`}
            section={section}
            defaultOpen={section.isEditing || section.key === 'housingToFind'}
            renderRowDetail={(row) => (row.detail ? rowDetails[row.detail] : null)}
          />
        ))}
      </div>
      {hasFootnote && (
        <p className="fr-text--xs fr-text-mention--grey fr-mt-2w fr-mb-0">
          * La résorption du mal-logement se paramètre depuis la page de résultats.
        </p>
      )}
    </>
  )
}
