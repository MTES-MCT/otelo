import { createSearchParamsCache, parseAsArrayOf, parseAsString } from 'nuqs/server'

export const searchParamsCache = createSearchParamsCache({
  epcis: parseAsArrayOf(parseAsString).withDefault([]),
  baseEpci: parseAsString.withDefault(''),
  millesime: parseAsString.withDefault(''),
  omphale: parseAsString.withDefault(''),
  projection: parseAsString.withDefault(''),
  q: parseAsString.withDefault(''),
  region: parseAsString.withDefault(''),
})
