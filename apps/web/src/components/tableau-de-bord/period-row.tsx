'use client'

import Button from '@codegouvfr/react-dsfr/Button'
import classNames from 'classnames'
import React, { useState } from 'react'
import { buildComparisonRows, ComparisonRow } from '~/app/(authenticated)/tableaux-de-bord/comparison-data'
import { TSimulationDashboardItem } from '~/schemas/simulation'
import { EvolutionBadge } from './evolution-badge'
import styles from './period-row.module.css'
import { RateByEpciSelect } from './rate-by-epci-select'
import { ScenarioCard } from './scenario-card'

interface PeriodRowProps {
  millesime: string
  projection: number
  simulations: TSimulationDashboardItem[]
  epciGroupId: string
  epcis: { code: string; name: string }[]
}

const ITEMS_PER_PAGE = 3

type Slot = { kind: 'sim'; sim: TSimulationDashboardItem; simIndex: number } | { kind: 'add' } | { kind: 'empty' }

export function PeriodRow({ millesime, projection, simulations, epciGroupId, epcis }: PeriodRowProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [currentPage, setCurrentPage] = useState(0)

  const addHref = `/simulation/parametrages-demographique?epciGroupId=${epciGroupId}&epcis=${epcis.map((e) => e.code).join(',')}&projection=${projection}`

  const rowsPerSim: ComparisonRow[][] = simulations.map((sim) => buildComparisonRows(sim, { projection, epcis }))
  const rowCount = rowsPerSim[0]?.length ?? 0

  const items: Slot[] = [...simulations.map((sim, simIndex) => ({ kind: 'sim' as const, sim, simIndex })), { kind: 'add' as const }]
  const totalPages = Math.max(1, items.length - ITEMS_PER_PAGE + 1)
  const pageStart = currentPage
  const windowItems = items.slice(pageStart, pageStart + ITEMS_PER_PAGE)
  const visibleSlots: Slot[] = Array.from({ length: ITEMS_PER_PAGE }, (_, i) => windowItems[i] ?? { kind: 'empty' as const })
  const hasPagination = items.length > ITEMS_PER_PAGE

  const collapsedPadding = (ITEMS_PER_PAGE - (items.length % ITEMS_PER_PAGE)) % ITEMS_PER_PAGE
  const collapsedSlots: Slot[] = [...items, ...Array.from({ length: collapsedPadding }, () => ({ kind: 'empty' as const }))]
  const gridSlots = isExpanded ? visibleSlots : collapsedSlots

  return (
    <div className={styles.periodRow}>
      <div className={styles.periodInfo}>
        <div className={styles.periodInfoBorder}>
          <span className="fr-text--lg fr-text-title--blue-france fr-text--bold fr-mb-0">
            {millesime} &rarr; {projection}
          </span>
          <button type="button" className={styles.toggleButton} onClick={() => setIsExpanded(!isExpanded)}>
            <span className="fr-text--sm fr-text-title--blue-france fr-text--medium fr-mb-0">
              Comparer les {simulations.length > 1 ? `${simulations.length} scénarios` : 'scénarios'}
            </span>
            <span
              className={classNames('ri-arrow-down-s-line fr-text-title--blue-france', styles.toggleIcon, {
                [styles.toggleIconOpen]: isExpanded,
              })}
            />
          </button>
        </div>
      </div>

      <div className={styles.cardGrid}>
        {gridSlots.map((slot, index) => {
          if (slot.kind === 'sim') {
            return <ScenarioCard key={slot.sim.id} simulation={slot.sim} isExpanded={isExpanded} />
          }
          if (slot.kind === 'add') {
            return (
              <div key={`add-${index}`} className={styles.placeholder}>
                <Button priority="tertiary no outline" linkProps={{ href: addHref }}>
                  Ajouter un sc&eacute;nario +
                </Button>
              </div>
            )
          }
          return <div key={`empty-${index}`} className={styles.placeholder} />
        })}
      </div>

      {isExpanded && (
        <>
          {Array.from({ length: rowCount }).map((_, rowIndex) => {
            const firstRow = rowsPerSim.find((rows) => rows[rowIndex])?.[rowIndex]
            if (!firstRow) return null
            const variantClass = firstRow.variant === 'light' ? styles.comparisonValueLight : styles.comparisonValueDefault
            return (
              <React.Fragment key={`row-${rowIndex}`}>
                <div className={styles.comparisonLabel}>
                  <span className="fr-text--sm fr-mb-0 fr-text--medium">{firstRow.label}</span>
                </div>
                <div className={styles.valuesGrid}>
                  {visibleSlots.map((slot, colIndex) => {
                    const isSim = slot.kind === 'sim'
                    const row = isSim ? rowsPerSim[slot.simIndex]?.[rowIndex] : null
                    return (
                      <div
                        key={`val-${rowIndex}-${colIndex}`}
                        className={classNames(styles.comparisonValue, isSim && variantClass, isSim && styles.comparisonValueFilled)}
                      >
                        {isSim && row && (
                          <>
                            {row.badge && <span className={styles.comparisonBadge}>{row.badge}</span>}
                            {row.value.kind === 'text' && (
                              <span className={classNames(!row.badge && 'fr-text--bold', 'fr-text--sm fr-mb-0')}>
                                {row.value.text}
                                {row.value.evolution && (
                                  <EvolutionBadge evolution={row.value.evolution} direction={row.evolutionDirection} />
                                )}
                              </span>
                            )}
                            {row.value.kind === 'byEpci' && (
                              <RateByEpciSelect entries={row.value.entries} evolutionDirection={row.evolutionDirection} />
                            )}
                          </>
                        )}
                      </div>
                    )
                  })}
                </div>
              </React.Fragment>
            )
          })}

          <div className={styles.openRow} />
          <div className={classNames(styles.valuesGrid, styles.valuesGridClean)}>
            {visibleSlots.map((slot, colIndex) => {
              const isSim = slot.kind === 'sim'
              return (
                <div key={`open-${colIndex}`} className={classNames(styles.openRow, { [styles.openRowWithAction]: isSim })}>
                  {isSim && (
                    <>
                      <span>Ouvrir</span>
                      <Button
                        iconId="ri-arrow-right-line"
                        priority="tertiary no outline"
                        linkProps={{ href: `/simulation/${slot.sim.id}/resultats` }}
                        title="Ouvrir le scénario"
                        size="small"
                      />
                    </>
                  )}
                </div>
              )
            })}
          </div>

          {hasPagination && (
            <div className={styles.pagination}>
              <button
                type="button"
                className={styles.paginationNav}
                onClick={() => setCurrentPage((p) => Math.max(0, p - 1))}
                disabled={currentPage === 0}
              >
                <span className="ri-arrow-left-s-line" aria-hidden />
                Pr&eacute;c&eacute;dent
              </button>
              <div className={styles.paginationBars}>
                {items.map((_, i) => {
                  const isVisible = i >= pageStart && i < pageStart + ITEMS_PER_PAGE
                  return <span key={`bar-${i}`} className={classNames(styles.paginationBar, isVisible && styles.paginationBarActive)} />
                })}
              </div>
              <button
                type="button"
                className={styles.paginationNav}
                onClick={() => setCurrentPage((p) => Math.min(totalPages - 1, p + 1))}
                disabled={currentPage === totalPages - 1}
              >
                Suivant
                <span className="ri-arrow-right-s-line" aria-hidden />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
