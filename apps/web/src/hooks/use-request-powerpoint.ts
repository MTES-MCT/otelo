import { useMutation } from '@tanstack/react-query'
import { useState } from 'react'
import { TRequestPowerpoint } from '~/schemas/export'

export const useRequestPowerpoint = () => {
  const [progressMessage, setProgressMessage] = useState<string>('')

  const postSimulation = async (params: TRequestPowerpoint) => {
    setProgressMessage('Validation de votre demande...')

    const response = await fetch('/api/simulations/request-powerpoint', {
      body: JSON.stringify(params),
      method: 'POST',
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.message || 'Une erreur est survenue lors de la génération du powerpoint')
    }

    setProgressMessage('Génération du PowerPoint en cours...')
    return response.json()
  }

  const { mutateAsync, isPending, isSuccess, isError, error } = useMutation({
    mutationFn: (initSimulationDto: TRequestPowerpoint) => postSimulation(initSimulationDto),
    onSuccess: () => {
      setProgressMessage('Demande de présentation PowerPoint bien reçue !')
    },
    onError: () => {
      setProgressMessage('')
    },
  })

  return {
    mutateAsync,
    isPending,
    isSuccess,
    isError,
    error: error as Error | null,
    progressMessage,
  }
}
