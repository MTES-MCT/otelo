import { useQuery } from '@tanstack/react-query'
import { useParams } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { TScenarioWithSimulationId } from '~/schemas/scenario'

export const useScenario = () => {
  const { id } = useParams()
  const { data: session } = useSession()

  const fetchSimulationScenario = async (simulationId: string) => {
    try {
      const response = await fetch(`/api/simulations/${simulationId}/scenario`, {
        cache: 'no-store',
      })
      if (!response.ok) {
        throw new Error('Failed to fetch user simulation scenario')
      }
      return response.json()
    } catch (error) {
      console.error('Error fetching user simulation scenario:', error)
    }
  }

  const { data, isLoading } = useQuery<TScenarioWithSimulationId>({
    enabled: !!session,
    queryFn: () => fetchSimulationScenario(id as string),
    queryKey: ['simulation-scenario', id],
    staleTime: 0,
  })

  return { data, isLoading }
}
