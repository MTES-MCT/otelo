'use client'

import { fr } from '@codegouvfr/react-dsfr'
import { Select } from '@codegouvfr/react-dsfr/Select'
import { EstimationBreakdown, EstimationTermKey, isTermSplitAcrossEpcis } from '@shared'
import classNames from 'classnames'
import { usePathname } from 'next/navigation'
import { FC } from 'react'
import { getFlowFromPathname, getSlugFromPathname } from '~/components/simulations/settings/wizard-steps'
import { tutorialAnchor } from '~/components/simulations/tutorial/tutorial-content'
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

export const ALL_EPCIS_SCOPE = 'all'

type EstimationCardProps = {
  /** `null` tant que la projection démographique n'est pas choisie : l'enveloppe reste, les chiffres non. */
  breakdown: EstimationBreakdown | null
  /** Nom du groupe d'EPCI en cours de paramétrage, affiché en sous-titre. */
  territoryLabel?: string | null
  /** Taille du périmètre complet, pour situer l'agrégat sous le libellé. */
  epciCount?: number
  projection: number | null
  /** Un recalcul est en cours : on garde la dernière valeur connue, en la grisant. */
  isStale: boolean
  /** Sans options, la carte reste sur l'agrégat et n'affiche pas de sélecteur de portée. */
  epciOptions?: Array<{ code: string; name: string }>
  /** EPCI auquel l'estimation est restreinte, ou `null` pour l'ensemble du territoire. */
  scopedEpciCode?: string | null
  onScopeChange?: (epciCode: string | null) => void
  /** Le moteur écarte cet EPCI du total : ses termes valent tous zéro, il faut le dire. */
  isScopedEpciExcluded?: boolean
}

const round = (value: number) => Math.round(value)

export const EstimationCard: FC<EstimationCardProps> = ({
  breakdown,
  territoryLabel,
  epciCount,
  projection,
  isStale,
  epciOptions,
  scopedEpciCode,
  onScopeChange,
  isScopedEpciExcluded,
}) => {
  const pathname = usePathname()
  const flow = getFlowFromPathname(pathname)
  const slug = getSlugFromPathname(pathname)

  const scopedEpciName = scopedEpciCode ? epciOptions?.find((epci) => epci.code === scopedEpciCode)?.name : null
  const hasScopeSelector = Boolean(epciOptions && epciOptions.length > 1 && onScopeChange)

  const header = (
    <>
      <p className={classNames(styles.cardTitle, fr.cx('fr-text--xs', 'fr-text--bold', 'fr-mb-1v'))}>Votre estimation en cours</p>
      {territoryLabel && (
        <p className={classNames(styles.subtitle, fr.cx('fr-text--xs', 'fr-mb-1w'))}>
          Territoire — {territoryLabel}
          {epciCount && epciCount > 1 ? ` (${epciCount} EPCI)` : ''}
        </p>
      )}
      {hasScopeSelector && (
        <div className={classNames(styles.scopeSelect, fr.cx('fr-mb-2w'))}>
          <Select
            label={undefined}
            nativeSelectProps={{
              'aria-label': "Territoire sur lequel porte l'estimation",
              value: scopedEpciCode ?? ALL_EPCIS_SCOPE,
              onChange: (event) => onScopeChange?.(event.target.value === ALL_EPCIS_SCOPE ? null : event.target.value),
            }}
          >
            <option value={ALL_EPCIS_SCOPE}>Ensemble du territoire</option>
            {epciOptions?.map((epci) => (
              <option key={epci.code} value={epci.code}>
                {epci.name}
              </option>
            ))}
          </Select>
        </div>
      )}
    </>
  )

  const renderWithoutFigures = (message: string) => (
    <div className={classNames(styles.card, 'shadow')} {...tutorialAnchor('estimation-card')}>
      {header}
      <p className={classNames(styles.footnote, fr.cx('fr-text--xs', 'fr-mb-0'))}>{message}</p>
    </div>
  )

  // Un paramétrage démographique non fait ne vaut pas une estimation à zéro : on annonce ce qui manque.
  if (!breakdown) {
    return renderWithoutFigures('Choisissez une projection de population puis de ménages pour afficher votre estimation.')
  }

  // Même principe pour un EPCI que le moteur écarte : ses dix termes valent zéro, et une colonne de
  // zéros se lirait comme une absence de besoin plutôt que comme une exclusion du calcul.
  if (isScopedEpciExcluded) {
    return renderWithoutFigures("Cet EPCI n'a pas de besoin en constructions neuves sur la période : il est écarté du total du territoire.")
  }

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
    // En vue agrégée, un terme et son jumeau de signe opposé peuvent coexister : ils viennent alors
    // d'EPCI différents, et le dire évite de lire une contradiction.
    const splitCount = !scopedEpciCode && isTermSplitAcrossEpcis(key, breakdown) ? breakdown.epciCounts[key] : 0

    return (
      <li key={key} className={classNames(styles.row, styles.termRow, 'fr-text--xs fr-mb-0', { [styles.editing]: isEditing })}>
        <span>
          {term.label}
          {term.footnote && <sup aria-hidden> *</sup>}
          {isEditing && <span className="fr-sr-only"> (en cours de paramétrage)</span>}
          {splitCount > 0 && <span className={styles.splitMention}>dont {splitCount} EPCI</span>}
        </span>
        <span className={fr.cx('fr-text--bold')}>{formatNumber(round(breakdown.values[key]))}</span>
      </li>
    )
  }

  return (
    <div
      className={classNames(styles.card, 'shadow', { [styles.stale]: isStale })}
      aria-busy={isStale}
      {...tutorialAnchor('estimation-card')}
    >
      {header}

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

      {scopedEpciName && (
        <p className={classNames(styles.footnote, fr.cx('fr-text--xs', 'fr-mt-1w', 'fr-mb-0'))}>Périmètre : {scopedEpciName}</p>
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
