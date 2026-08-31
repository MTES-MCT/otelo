'use client'

import classNames from 'classnames'
import { parseAsString, parseAsStringLiteral, useQueryStates } from 'nuqs'
import type { FC } from 'react'
import { useMemo } from 'react'
import styles from '~/app/(authenticated)/admin/admin.module.css'
import { getDateFrom, getToday } from '~/utils/date-helpers'
import { ADMIN_CARD, ADMIN_CHIP, ADMIN_FILTER_CHIPS } from './admin-classes'

export const PERIOD_PRESETS = ['7', '14', '30', '90'] as const

export type PeriodPreset = (typeof PERIOD_PRESETS)[number]

export const DEFAULT_PERIOD_PRESET: PeriodPreset = '30'

export type PeriodRange = {
  from: string
  to: string
}

// L'état vit dans l'URL (nuqs) : la page est partageable et les boutons d'export lisent
// exactement la même période que les graphiques, sans seconde source de vérité.
export function usePeriodRange() {
  const [state, setState] = useQueryStates({
    preset: parseAsStringLiteral(PERIOD_PRESETS).withDefault(DEFAULT_PERIOD_PRESET),
    from: parseAsString.withDefault(''),
    to: parseAsString.withDefault(''),
  })

  const range = useMemo<PeriodRange>(() => {
    if (state.from && state.to) {
      return { from: state.from, to: state.to }
    }

    return { from: getDateFrom(Number(state.preset)), to: getToday() }
  }, [state.from, state.preset, state.to])

  return {
    range,
    /** Vrai quand une plage personnalisée est active : aucune puce ne doit alors être surlignée. */
    isCustom: Boolean(state.from && state.to),
    preset: state.preset,
    setPreset: (preset: PeriodPreset) => setState({ preset, from: '', to: '' }),
    setCustomRange: (from: string, to: string) => setState({ from, to }),
  }
}

export const PeriodSelector: FC = () => {
  const { isCustom, preset, range, setCustomRange, setPreset } = usePeriodRange()

  return (
    <div className={classNames(ADMIN_CARD, 'fr-mb-3w')}>
      <div className="fr-p-2w">
        <div className="fr-flex fr-flex-wrap fr-align-items-center fr-flex-gap-4v">
          <div className={ADMIN_FILTER_CHIPS}>
            {PERIOD_PRESETS.map((value) => (
              <button
                key={value}
                type="button"
                aria-pressed={!isCustom && preset === value}
                className={classNames(ADMIN_CHIP, !isCustom && preset === value ? styles.chipActive : styles.chip)}
                onClick={() => setPreset(value)}
              >
                {value} jours
              </button>
            ))}
          </div>
          <div className="fr-flex fr-align-items-center fr-flex-gap-2v fr-ml-auto">
            <label className="fr-text--sm fr-mb-0" htmlFor="period-from">
              Du
            </label>
            <input
              className={styles.dateInput}
              id="period-from"
              max={range.to}
              onChange={(event) => setCustomRange(event.target.value, range.to)}
              type="date"
              value={range.from}
            />
            <label className="fr-text--sm fr-mb-0" htmlFor="period-to">
              au
            </label>
            <input
              className={styles.dateInput}
              id="period-to"
              min={range.from}
              onChange={(event) => setCustomRange(range.from, event.target.value)}
              type="date"
              value={range.to}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
