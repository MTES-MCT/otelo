import { useQuery } from '@tanstack/react-query'
import { parseAsInteger, parseAsString, useQueryStates } from 'nuqs'

export const useDataVisualisation = () => {
  const [queryStates] = useQueryStates({
    epci: parseAsInteger,
    type: parseAsString,
    populationType: parseAsString.withDefault('haute'),
    source: parseAsString.withDefault('rp'),
  })

  const fetchDataVisualisation = async () => {
    try {
      const response = await fetch(
        `/api/data-visualisation?epci=${queryStates.epci}&type=${queryStates.type}&populationType=${queryStates.populationType}&source=${queryStates.source}`,
      )
      if (!response.ok) {
        throw new Error('Failed to fetch data visualisation')
      }
      return response.json()
    } catch (error) {
      console.error('Error fetching data visualisation:', error)
      return []
    }
  }
  const { data, isLoading } = useQuery({
    enabled: !!queryStates.epci && !!queryStates.type,
    queryFn: () => fetchDataVisualisation(),
    queryKey: ['data-visualisation', queryStates.epci, queryStates.type, queryStates.populationType, queryStates.source],
  })
  return { data, isLoading }
}
