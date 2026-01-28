'use client'

import { parseAsArrayOf, parseAsString, parseAsStringEnum, useQueryStates } from 'nuqs'
import { AutocompleteInput } from '~/components/simulations/autocomplete/autocomplete-input'
import { GeoApiCommuneResult, GeoApiEpciResult } from '~/hooks/use-geoapi-search'

export const DatavisualisationAutocomplete = () => {
  const [_, setSearchQueryState] = useQueryStates({
    epci: parseAsString,
    type: parseAsStringEnum([
      'projection-population-evolution',
      'projection-menages-evolution',
      'population-evolution',
      'menage-evolution',
    ]),
    epcis: parseAsArrayOf(parseAsString).withDefault([]),
    region: parseAsString.withDefault(''),
    epciChart: parseAsString.withDefault(''),
  })
  const handleInputClick = (item: GeoApiEpciResult | GeoApiCommuneResult) => {
    const code = 'codeEpci' in item ? (item.codeEpci ?? item.code) : item.code
    const region = 'codesRegions' in item ? item.codesRegions[0] : item.codeRegion
    setSearchQueryState({
      epci: code,
      epcis: [code],
      region,
      epciChart: code,
    })
  }
  return (
    <AutocompleteInput
      hintText="Saisissez le nom de l'EPCI du territoire concerné, ou par défaut, vous pouvez saisir le nom de la commune ou son code postal."
      onClick={handleInputClick}
    />
  )
}
