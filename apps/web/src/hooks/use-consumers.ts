import { useQuery } from '@tanstack/react-query'

export interface ApiConsumer {
  id: string
  name: string
  prefix: string
  active: boolean
  createdAt: string
  lastUsedAt: string | null
}

export const useConsumers = () => {
  const fetchConsumers = async (): Promise<ApiConsumer[]> => {
    const response = await fetch('/api/admin/consumers')
    if (!response.ok) {
      throw new Error('Failed to fetch consumers')
    }
    return response.json()
  }

  return useQuery({
    queryFn: fetchConsumers,
    queryKey: ['consumers'],
  })
}
