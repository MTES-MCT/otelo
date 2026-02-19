import { useQuery } from '@tanstack/react-query'

const fetchConsumerKey = async (id: string): Promise<{ key: string }> => {
  const response = await fetch(`/api/admin/consumers/${id}/key`)
  if (!response.ok) {
    throw new Error('Failed to get key')
  }
  return response.json()
}

export const useGetConsumerKey = (id: string | null) => {
  return useQuery({
    queryKey: ['consumer-key', id],
    queryFn: () => fetchConsumerKey(id!),
    enabled: !!id,
  })
}
