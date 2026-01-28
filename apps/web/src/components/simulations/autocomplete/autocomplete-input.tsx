'use client'

import Input from '@codegouvfr/react-dsfr/Input'
import classNames from 'classnames'
import { FC, useEffect, useState } from 'react'
import { tss } from 'tss-react'
import { AutocompleteResults } from '~/components/simulations/autocomplete/autocomplete-results'
import { GeoApiCommuneResult, GeoApiEpciResult, useGeoApiSearch } from '~/hooks/use-geoapi-search'

type AutocompleteInputProps = {
  hintText: string
  label?: string
  onClick?: (item: GeoApiEpciResult | GeoApiCommuneResult) => void
  defaultValue?: string
  className?: string
}

export const AutocompleteInput: FC<AutocompleteInputProps> = ({
  hintText,
  label,
  onClick,
  defaultValue,
  className,
}: AutocompleteInputProps) => {
  const { classes } = useStyles()
  const { data, isError, searchQuery, setSearchQuery } = useGeoApiSearch()
  const [isResultsVisible, setIsResultsVisible] = useState(false)

  useEffect(() => {
    if (defaultValue) {
      setSearchQuery(defaultValue)
    }
  }, [defaultValue])

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
