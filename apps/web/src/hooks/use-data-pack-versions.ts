import { useQuery } from '@tanstack/react-query'

export interface DataPackVersion {
  id: string
  millesime: string
  label: string
  isActive: boolean
  createdAt: string
}

export function useDataPackVersions() {
  return useQuery<DataPackVersion[]>({
    queryKey: ['data-pack-versions'],
    queryFn: async () => {
      const response = await fetch('/api/data-pack-versions')
      if (!response.ok) {
        throw new Error('Failed to fetch data pack versions')
      }
      return response.json()
    },
  })
}
