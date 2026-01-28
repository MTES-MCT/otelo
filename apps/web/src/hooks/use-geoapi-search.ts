import { useQueries } from '@tanstack/react-query'
import { useQueryState } from 'nuqs'
import { useEffect, useState } from 'react'
import { useDebounce } from 'use-debounce'

export interface GeoApiEpciResult {
  code: string
  codesRegions: string[]
  nom: string
}

export interface GeoApiCommuneResult {
  code: string
  codeEpci: string
  codeRegion: string
  nom: string
}

export type GeoApiResults = GeoApiEpciResult[] | GeoApiCommuneResult[]

const isPostalCode = (query: string): boolean => /^\d{5}$/.test(query)

async function fetchCommunes(query: string): Promise<GeoApiCommuneResult[]> {
  const queryParam = isPostalCode(query) ? 'codePostal' : 'nom'
  const response = await fetch(`https://geo.api.gouv.fr/communes?${queryParam}=${encodeURIComponent(query)}&limit=5`)
  if (!response.ok) {
    throw new Error('Error occurred calling GeoApi')
  }
  return response.json()
}

async function fetchEpcis(query: string): Promise<GeoApiEpciResult[]> {
  const response = await fetch(`https://geo.api.gouv.fr/epcis?nom=${encodeURIComponent(query)}&limit=5`)
  if (!response.ok) {
    throw new Error('Error occurred calling GeoApi')
  }
  return response.json()
}

export interface GeoApiSearchResults {
  communes: GeoApiCommuneResult[]
  epcis: GeoApiEpciResult[]
}

export const useGeoApiSearch = (debounceTime = 200) => {
  const [shouldFetch, setShouldFetch] = useState(false)
  const [searchQueryState] = useQueryState('q')

  const [searchQuery, setSearchQuery] = useState(searchQueryState || '')
  const [debouncedSearchQuery] = useDebounce(searchQuery, debounceTime)

  useEffect(() => {
    setShouldFetch(debouncedSearchQuery.length >= 3)
  }, [debouncedSearchQuery])

  const results = useQueries({
    queries: [
      {
        enabled: shouldFetch,
        queryFn: () => fetchCommunes(debouncedSearchQuery),
        queryKey: ['communes', debouncedSearchQuery],
      },
      {
        enabled: shouldFetch && !isPostalCode(debouncedSearchQuery),
        queryFn: () => fetchEpcis(debouncedSearchQuery),
        queryKey: ['epcis', debouncedSearchQuery],
      },
    ],
  })

  const isLoading = results.some((result) => result.isLoading)
  const isError = results.some((result) => result.isError)

  const communes = results[0]?.data || []
  const epcis = results[1]?.data || []

  // Filter out EPCIS and communes in IDF
  const filteredCommunes = communes.filter((commune) => commune.codeRegion !== '11')
  const filteredEpcis = epcis.filter((epci) => !epci.codesRegions.includes('11'))

  const data: GeoApiSearchResults = {
    communes: filteredCommunes,
    epcis: filteredEpcis,
  }

  return {
    data,
    isError,
    isLoading,
    searchQuery,
    setSearchQuery,
  }
}
