import { z } from 'zod'

/** Liste séparée par des virgules dans la query string. Chaque élément a un coût serveur. */
export function commaSeparated<T extends z.ZodTypeAny>(item: T, max: number) {
  return z.preprocess(
    (value) =>
      typeof value === 'string'
        ? value
            .split(',')
            .map((entry) => entry.trim())
            .filter((entry) => entry !== '')
        : value,
    z.array(item).min(1).max(max),
  )
}

/** Code EPCI : un SIREN, neuf chiffres. */
export const ZEpciCode = z.string().regex(/^\d{9}$/, 'Code EPCI invalide (9 chiffres attendus)')
