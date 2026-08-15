import { BadRequestException } from '@nestjs/common'

/** Période par défaut quand l'appelant n'en fournit pas. */
export const DEFAULT_RANGE_DAYS = 30

export type DateRange = {
  /** Borne basse incluse. */
  from: Date
  /** Borne haute EXCLUE : `to` + 1 jour, pour inclure toute la journée de `to`. */
  toExclusive: Date
}

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/

function parseIsoDate(value: string, field: string): Date {
  if (!ISO_DATE.test(value)) {
    throw new BadRequestException(`Le paramètre "${field}" doit être une date au format YYYY-MM-DD`)
  }

  const date = new Date(`${value}T00:00:00.000Z`)

  if (Number.isNaN(date.getTime())) {
    throw new BadRequestException(`Le paramètre "${field}" n'est pas une date valide`)
  }

  return date
}

function startOfUtcDay(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()))
}

/**
 * Résout la période commune à tous les endpoints de statistiques et d'export.
 *
 * Les bornes sont semi-ouvertes (`>= from` et `< to + 1 jour`) : c'est la seule façon
 * d'inclure toute la journée de `to` sans dépendre de la précision des timestamps.
 *
 * Les deux paramètres doivent être fournis ensemble ; l'un sans l'autre est une erreur
 * plutôt qu'un silence, sinon une période partiellement renseignée passerait inaperçue.
 */
export function resolveDateRange(from?: string, to?: string): DateRange {
  if (!from && !to) {
    const toExclusive = startOfUtcDay(new Date())
    toExclusive.setUTCDate(toExclusive.getUTCDate() + 1)

    const defaultFrom = new Date(toExclusive)
    defaultFrom.setUTCDate(defaultFrom.getUTCDate() - DEFAULT_RANGE_DAYS)

    return { from: defaultFrom, toExclusive }
  }

  if (!from || !to) {
    throw new BadRequestException('Les paramètres "from" et "to" doivent être fournis ensemble')
  }

  const parsedFrom = parseIsoDate(from, 'from')
  const parsedTo = parseIsoDate(to, 'to')

  if (parsedTo < parsedFrom) {
    throw new BadRequestException('Le paramètre "to" ne peut pas être antérieur à "from"')
  }

  const toExclusive = new Date(parsedTo)
  toExclusive.setUTCDate(toExclusive.getUTCDate() + 1)

  return { from: parsedFrom, toExclusive }
}

/** Suffixe de nom de fichier d'export, aligné sur la période demandée. */
export function formatRangeForFilename({ from, toExclusive }: DateRange): string {
  const toInclusive = new Date(toExclusive)
  toInclusive.setUTCDate(toInclusive.getUTCDate() - 1)

  return `${from.toISOString().slice(0, 10)}_${toInclusive.toISOString().slice(0, 10)}`
}
