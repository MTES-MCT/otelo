import { useMutation } from '@tanstack/react-query'

export type TPowerpointDuplicateReason = 'RECENT' | 'SAME_DAY' | 'SAME_SCENARIOS_AND_TERRITORY'

export type TPreviousPowerpointRequest = {
  requestId: string
  requestedAt: string
  documentType: string | null
  nextStep: string | null
  periodStart: number | null
  periodEnd: number | null
  simulationNames: string[]
  epciNames: string[]
  reasons: TPowerpointDuplicateReason[]
}

export type TPowerpointDuplicateCheck = {
  windowMinutes: number
  previousRequest: TPreviousPowerpointRequest | null
}

export const useCheckPowerpointDuplicate = () => {
  const checkDuplicate = async (params: { selectedSimulations: string[]; epciCodes: string[] }): Promise<TPowerpointDuplicateCheck> => {
    const response = await fetch('/api/simulations/request-powerpoint/check', {
      body: JSON.stringify(params),
      method: 'POST',
    })

    if (!response.ok) {
      throw new Error('Impossible de vérifier vos demandes récentes')
    }

    return response.json()
  }

  const { mutateAsync, isPending } = useMutation({
    mutationFn: checkDuplicate,
  })

  return { checkDuplicate: mutateAsync, isChecking: isPending }
}
