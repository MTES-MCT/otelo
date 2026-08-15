'use client'

import Input from '@codegouvfr/react-dsfr/Input'
import classNames from 'classnames'
import { FC, useEffect, useState } from 'react'
import { tss } from 'tss-react'
import { useDebounce } from 'use-debounce'
import { AutocompleteResults } from '~/components/simulations/autocomplete/autocomplete-results'
import { GeoApiCommuneResult, GeoApiEpciResult, useGeoApiSearch } from '~/hooks/use-geoapi-search'
import { trackSiteSearch } from '~/lib/tracking'

type AutocompleteInputProps = {
  hintText: string
  label?: string
  onClick?: (item: GeoApiEpciResult | GeoApiCommuneResult) => void
  defaultValue?: string
  className?: string
  /** Catégorie du rapport « Recherche interne » de Matomo. Omise, la recherche n'est pas remontée. */
  searchCategory?: string
}

/** Délai avant de considérer une saisie comme une recherche aboutie plutôt qu'une frappe en cours. */
const SEARCH_TRACKING_DELAY = 1200
const MIN_TRACKED_QUERY_LENGTH = 3

export const AutocompleteInput: FC<AutocompleteInputProps> = ({
  hintText,
  label,
  onClick,
  defaultValue,
  className,
  searchCategory,
}: AutocompleteInputProps) => {
  const { classes } = useStyles()
  const { data, isError, searchQuery, setSearchQuery } = useGeoApiSearch()
  const [isResultsVisible, setIsResultsVisible] = useState(false)
  const [settledQuery] = useDebounce(searchQuery, SEARCH_TRACKING_DELAY)

  useEffect(() => {
    if (defaultValue) {
      setSearchQuery(defaultValue)
    }
  }, [defaultValue])

  // Alimente le rapport « Recherche interne » de Matomo, qui expose les recherches
  // restées sans résultat — impossible à obtenir avec un simple événement.
  useEffect(() => {
    if (!searchCategory || settledQuery.length < MIN_TRACKED_QUERY_LENGTH) {
      return
    }

    trackSiteSearch(settledQuery, searchCategory, data.communes.length + data.epcis.length)
  }, [data, searchCategory, settledQuery])

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(event.target.value)
    setIsResultsVisible(true)
  }

  const handleInputClick = (item: GeoApiEpciResult | GeoApiCommuneResult) => {
    if (onClick) {
      onClick(item)
    }

    setSearchQuery(item.nom)
    setIsResultsVisible(false)
  }

  const hasResults = (data.communes.length > 0 || data.epcis.length > 0) && isResultsVisible

  return (
    <div className={classNames(classes.container, className)}>
      <Input
        hintText={hintText}
        label={label}
        nativeInputProps={{ onChange: handleInputChange, value: searchQuery }}
        state={isError ? 'error' : 'default'}
        style={{ marginBottom: 0 }}
      />
      {hasResults && <AutocompleteResults onClick={handleInputClick} data={data} />}
    </div>
  )
}

const useStyles = tss.create({
  container: {
    position: 'relative',
  },
})
