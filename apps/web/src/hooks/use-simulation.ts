import { useQuery } from '@tanstack/react-query'
import { useParams } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { TSimulationWithResults } from '~/schemas/simulation'

export const useSimulation = (initialData?: TSimulationWithResults) => {
  const { id } = useParams()
  const { data: session } = useSession()

  const fetchSimulationResults = async (simulationId: string) => {
    try {
      const response = await fetch(`/api/simulations/${simulationId}`)
      if (!response.ok) {
        throw new Error('Failed to fetch user simulation results')
      }
      return response.json()
    } catch (error) {
      console.error('Error fetching user simulation results:', error)
      return []
    }
  }

  const { data, isLoading } = useQuery<TSimulationWithResults>({
    enabled: !!session,
    initialData,
    queryFn: () => fetchSimulationResults(id as string),
    queryKey: ['simulation', id],
  })

  return { data, isLoading }
}
