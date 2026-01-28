import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { TInitSimulationDto } from '~/schemas/simulation'

interface CreateSimulationOptions {
  redirectUri?: string
}

export const useCreateSimulation = (options: CreateSimulationOptions = {}) => {
  const router = useRouter()
  const queryClient = useQueryClient()
  const postSimulation = async (initSimulationDto: TInitSimulationDto) => {
    try {
      const response = await fetch('/api/simulations', {
        body: JSON.stringify(initSimulationDto),
        method: 'POST',
      })
      if (!response.ok) {
        throw new Error('Failed to create simulation')
      }
      const data = await response.json()
      return data
    } catch (error) {
      console.error('Failed to create simulation with error:', error)
    }
  }

  const { isPending, mutateAsync } = useMutation({
    mutationFn: (initSimulationDto: TInitSimulationDto) => postSimulation(initSimulationDto),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['simulations'] })

      if (!options.redirectUri) {
        toast.success('Simulation créée avec succès.', {
          description: 'Redirection en cours vers votre résultat.',
        })
      }
      const redirectPath = options.redirectUri?.replace('{{id}}', data.id) ?? `/simulation/${data.id}/resultats`
      router.push(redirectPath)
    },
  })

  return { isPending, mutateAsync }
}
