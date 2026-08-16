import { BadRequestException } from '@nestjs/common'
import dayjs from 'dayjs'
import customParseFormat from 'dayjs/plugin/customParseFormat'
import utc from 'dayjs/plugin/utc'

dayjs.extend(utc)
dayjs.extend(customParseFormat)

export const DEFAULT_RANGE_DAYS = 30

const ISO_DATE_FORMAT = 'YYYY-MM-DD'

export type DateRange = {
  from: Date
  /** Borne haute EXCLUE : `to` + 1 jour, pour inclure toute la journée de `to`. */
  toExclusive: Date
}

function parseIsoDate(value: string, field: string): dayjs.Dayjs {
  const date = dayjs.utc(value, ISO_DATE_FORMAT, true)

  if (!date.isValid()) {
    throw new BadRequestException(`Le paramètre "${field}" doit être une date au format ${ISO_DATE_FORMAT}`)
  }

  return date
}

export function resolveDateRange(from?: string, to?: string): DateRange {
  if (!from && !to) {
    const toExclusive = dayjs.utc().startOf('day').add(1, 'day')

    return { from: toExclusive.subtract(DEFAULT_RANGE_DAYS, 'day').toDate(), toExclusive: toExclusive.toDate() }
  }

  if (!from || !to) {
    throw new BadRequestException('Les paramètres "from" et "to" doivent être fournis ensemble')
  }

  const parsedFrom = parseIsoDate(from, 'from')
  const parsedTo = parseIsoDate(to, 'to')

  if (parsedTo.isBefore(parsedFrom)) {
    throw new BadRequestException('Le paramètre "to" ne peut pas être antérieur à "from"')
  }

  return { from: parsedFrom.toDate(), toExclusive: parsedTo.add(1, 'day').toDate() }
}

export function formatRangeForFilename({ from, toExclusive }: DateRange): string {
  return `${dayjs.utc(from).format(ISO_DATE_FORMAT)}_${dayjs.utc(toExclusive).subtract(1, 'day').format(ISO_DATE_FORMAT)}`
}
