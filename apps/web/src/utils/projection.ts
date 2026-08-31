const FALLBACK_MILLESIME = 2021

export const MAX_PROJECTION_YEAR = 2050
export const DEFAULT_PROJECTION_YEAR = 2030

/**
 * Première année sélectionnable pour l'horizon de temps.
 *
 * La projection court du 1er janvier du millésime au 1er janvier de l'année choisie : viser le
 * millésime lui-même donnerait une période nulle (« 2022 → 2022 »). Le minimum est donc N+1.
 */
export const getMinProjectionYear = (millesime?: string | number | null): number => {
  const year = Number(millesime)
  return (Number.isFinite(year) && year > 0 ? year : FALLBACK_MILLESIME) + 1
}

/** Ramène une projection dans les bornes autorisées par le millésime. */
export const clampProjectionYear = (projection: number, millesime?: string | number | null): number => {
  const minYear = getMinProjectionYear(millesime)
  const year = Number.isFinite(projection) ? projection : DEFAULT_PROJECTION_YEAR
  return Math.min(Math.max(year, minYear), MAX_PROJECTION_YEAR)
}
