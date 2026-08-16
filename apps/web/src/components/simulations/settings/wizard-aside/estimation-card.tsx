'use client'

import { fr } from '@codegouvfr/react-dsfr'
import classNames from 'classnames'
import { usePathname } from 'next/navigation'
import { FC } from 'react'
import { getFlowFromPathname, getSlugFromPathname } from '~/components/simulations/settings/wizard-steps'
import { tutorialAnchor } from '~/components/simulations/tutorial/tutorial-content'
import { EstimationBreakdown, EstimationTermKey } from '~/utils/estimation-breakdown'
import { formatNumber } from '~/utils/format-numbers'
import { sPluriel } from '~/utils/sPluriel'
import {
  buildEstimationTotals,
  ESTIMATION_SECTIONS,
  ESTIMATION_TERMS,
  getSectionTotal,
  isTermBeingEdited,
  isTermVisible,
} from './estimation-terms'
import styles from './wizard-aside.module.css'

type EstimationCardProps = {
  breakdown: EstimationBreakdown
  /** Nom du groupe d'EPCI en cours de paramétrage, affiché en sous-titre. */
  territoryLabel?: string | null
  projection: number | null
  /** Un recalcul est en cours : on garde la dernière valeur connue, en la grisant. */
  isStale: boolean
}

const round = (value: number) => Math.round(value)

export const EstimationCard: FC<EstimationCardProps> = ({ breakdown, territoryLabel, projection, isStale }) => {
  const pathname = usePathname()
  const flow = getFlowFromPathname(pathname)
  const slug = getSlugFromPathname(pathname)

  const totals = buildEstimationTotals(breakdown, slug, flow)
  const newConstructions = round(totals.newConstructions)
  const visibleTerms = ESTIMATION_SECTIONS.flatMap((section) => section.terms).filter((key) => isTermVisible(key, breakdown, slug, flow))
  const hasFootnote = visibleTerms.some((key) => ESTIMATION_TERMS[key].footnote)
  // En modification, la colonne s'affiche dès l'horizon de temps : aucun terme n'a encore de sens,
  // et un total à zéro se lirait comme une estimation plutôt que comme une absence d'estimation.
  const hasTotals = visibleTerms.length > 0

  const renderTerm = (key: EstimationTermKey) => {
    if (!isTermVisible(key, breakdown, slug, flow)) return null

    const term = ESTIMATION_TERMS[key]
    const isEditing = isTermBeingEdited(key, slug)

    return (
      <li key={key} className={classNames(styles.row, styles.termRow, 'fr-text--xs fr-mb-0', { [styles.editing]: isEditing })}>
        <span>
          {term.label}
          {term.footnote && <sup aria-hidden> *</sup>}
          {isEditing && <span className="fr-sr-only"> (en cours de paramétrage)</span>}
        </span>
        <span className={fr.cx('fr-text--bold')}>{formatNumber(round(breakdown[key]))}</span>
      </li>
    )
  }

  return (
    <div
      className={classNames(styles.card, 'shadow', { [styles.stale]: isStale })}
      aria-busy={isStale}
      {...tutorialAnchor('estimation-card')}
    >
      <p className={classNames(styles.cardTitle, fr.cx('fr-text--xs', 'fr-text--bold', 'fr-mb-1v'))}>Votre estimation en cours</p>
      {territoryLabel && <p className={classNames(styles.subtitle, fr.cx('fr-text--xs', 'fr-mb-2w'))}>Territoire — {territoryLabel}</p>}

      {ESTIMATION_SECTIONS.map((section) => {
        const sectionTotal = getSectionTotal(section, breakdown, slug, flow)
        const terms = section.terms.filter((key) => isTermVisible(key, breakdown, slug, flow))

        return (
          <section key={section.key} className={fr.cx('fr-mb-2w')}>
            <p
              className={classNames(styles.row, fr.cx('fr-text--xs', 'fr-text--bold', 'fr-mb-1v'), {
                [styles.sectionTitle]: terms.length > 0,
              })}
            >
              <span>{section.title}</span>
              {sectionTotal !== null && <span>{formatNumber(round(sectionTotal))}</span>}
            </p>
            {terms.length > 0 && <ul className={styles.questionList}>{terms.map(renderTerm)}</ul>}
          </section>
        )
      })}

      {hasTotals && (
        <>
          <hr className={fr.cx('fr-pb-1w')} />

          <ul className={styles.questionList}>
            <li className={classNames(styles.row, styles.total, 'fr-text--xs fr-mb-0')}>
              <span>Besoin en logements supplémentaires</span>
              <span className={fr.cx('fr-text--bold')}>{formatNumber(round(totals.additionalNeed))}</span>
            </li>
            <li className={classNames(styles.row, styles.total, 'fr-text--xs fr-mb-0')}>
              <span>Optimisation du parc existant</span>
              <span className={fr.cx('fr-text--bold')}>{formatNumber(round(totals.existingParcOptimisation))}</span>
            </li>
            <li className={classNames(styles.row, styles.total, styles.headline, fr.cx('fr-text--sm', 'fr-text--bold'))}>
              <span>Constructions neuves</span>
              <span>{formatNumber(newConstructions)}</span>
            </li>
          </ul>

          <p className={classNames(styles.footnote, fr.cx('fr-text--xs', 'fr-mt-1w', 'fr-mb-0'))}>
            logement{sPluriel(newConstructions)} neuf{sPluriel(newConstructions)} à construire{projection ? ` d'ici ${projection}` : ''}
          </p>
        </>
      )}

      {hasFootnote && (
        <p className={classNames(styles.footnote, fr.cx('fr-text--xs', 'fr-mt-1w', 'fr-mb-0'))}>
          * La résorption du mal-logement se paramètre depuis la page de résultats.
        </p>
      )}

      <hr className={fr.cx('fr-mt-2w', 'fr-pb-1w')} />

      <p className={classNames(styles.cardTitle, fr.cx('fr-text--xs', 'fr-mb-0'))}>Mis à jour à chaque paramètre modifié</p>
    </div>
  )
}
