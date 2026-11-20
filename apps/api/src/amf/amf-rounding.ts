import { TAmfRange } from './amf.schemas'

/**
 * Arrondi d'affichage d'un volume annuel : à l'unité sous 100, à deux chiffres significatifs au-delà
 * (1 234 → 1 200). Le signe est conservé.
 */
export function roundForDisplay(value: number): number {
  const magnitude = Math.abs(value)
  if (magnitude < 100) {
    return Math.round(value) || 0
  }
  const power = 10 ** (Math.floor(Math.log10(magnitude)) - 1)
  return Math.sign(value) * Math.round(magnitude / power) * power
}

/** Fourchette ordonnée et arrondie entre deux valeurs ; `null` quand les deux bornes s'arrondissent à 0. */
export function toRange(a: number, b: number): TAmfRange | null {
  const min = roundForDisplay(Math.min(a, b))
  const max = roundForDisplay(Math.max(a, b))
  return min === 0 && max === 0 ? null : { min, max }
}
