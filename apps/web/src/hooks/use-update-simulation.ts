import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { useSimulationSSEContext } from '~/components/collaboration/simulation-sse-provider'
import { TUpdateBadHousingSimulationDto, TUpdateDemographicSimulationDto } from '~/schemas/simulation'

const putSimulation = async (updateSimulationDto: TUpdateBadHousingSimulationDto | TUpdateDemographicSimulationDto, clientId?: string) => {
  try {
    const headers: Record<string, string> = {}
    if (clientId) headers['x-client-id'] = clientId

    const response = await fetch(`/api/simulations/${updateSimulationDto.id}/scenario`, {
      body: JSON.stringify(updateSimulationDto.scenario),
      method: 'PUT',
      headers,
    })
    if (!response.ok) {
      throw new Error('Failed to update simulation')
    }
    const data = await response.json()
    return data
  } catch (error) {
    console.error('Failed to update simulation with error:', error)
  }
}

export const useUpdateBadHousingSimulation = () => {
  const router = useRouter()
  const queryClient = useQueryClient()
  const sseContext = useSimulationSSEContext()
  const { isPending, mutateAsync } = useMutation({
    mutationFn: (updateSimulationDto: TUpdateBadHousingSimulationDto) => putSimulation(updateSimulationDto, sseContext?.clientId),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['simulations'] })
      queryClient.invalidateQueries({ queryKey: ['simulation-scenario', data.id] })
      queryClient.invalidateQueries({ queryKey: ['activity', data.id] })
      toast.success('Simulation mise à jour avec succès.', {
        description: 'Redirection en cours vers votre simulation.',
      })

      router.push(`/simulation/${data.id}/resultats`)
      router.refresh()
    },
  })

  return { isPending, mutateAsync }
}

export const useUpdateDemographicSimulation = () => {
  const router = useRouter()
  const queryClient = useQueryClient()
  const sseContext = useSimulationSSEContext()
  const { isPending, mutateAsync } = useMutation({
    mutationFn: (updateSimulationDto: TUpdateDemographicSimulationDto) => putSimulation(updateSimulationDto, sseContext?.clientId),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['simulations'] })
      queryClient.invalidateQueries({ queryKey: ['simulation-scenario', data.id] })
      queryClient.invalidateQueries({ queryKey: ['activity', data.id] })
      toast.success('Simulation mise à jour avec succès.', {
        description: 'Redirection en cours vers votre simulation.',
      })

      router.push(`/simulation/${data.id}/resultats`)
      router.refresh()
    },
  })
  return { isPending, mutateAsync }
}
