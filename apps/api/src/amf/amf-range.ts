import { TAmfRange } from './amf.schemas'

/** Paliers fins, pour le total et la moyenne annuelle : la borne haute ne dépasse jamais 1,25 fois la borne basse. */
export const FINE_STEPS = [1, 1.2, 1.5, 2, 2.5, 3, 4, 5, 6, 7, 8] as const

/** Paliers larges, pour le détail par poste, plus petit et plus incertain que le total. */
export const COARSE_STEPS = [1, 2, 5] as const

/**
 * Fourchette à paliers fixes encadrant `value`, pour ne jamais exposer le chiffre exact.
 *
 * Les paliers suivent `steps` à chaque puissance de dix (ex. 1 000 – 1 200 – 1 500…). Sous `floor`, la fourchette
 * vaut `[0, floor]` (« moins de… »). Une valeur négative donne la fourchette symétrique, en négatif.
 */
export function toRange(value: number, steps: readonly number[], floor: number): TAmfRange {
  const magnitude = Math.abs(value)
  const sign = value < 0 ? -1 : 1

  if (magnitude < floor) {
    return sign < 0 ? { min: -floor, max: 0 } : { min: 0, max: floor }
  }

  let power = 1
  while (power * 10 <= magnitude) {
    power *= 10
  }
  const mantissa = magnitude / power
  const index = steps.filter((step) => step <= mantissa).length - 1
  const low = Math.round(steps[index] * power)
  const high = Math.round((steps[index + 1] ?? 10) * power)

  return sign < 0 ? { min: -high, max: -low } : { min: low, max: high }
}
