import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

interface SubmitFeedbackPayload {
  rating: number
  comment?: string
}

export const useSubmitFeedback = () => {
  const queryClient = useQueryClient()

  const submitFeedback = async (payload: SubmitFeedbackPayload) => {
    const response = await fetch('/api/feedback/submit', {
      body: JSON.stringify(payload),
      method: 'POST',
    })

    if (!response.ok) {
      throw new Error('Failed to submit feedback')
    }

    return response.json()
  }

  return useMutation({
    mutationFn: submitFeedback,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feedback-status'] })
      toast.success('Merci pour votre retour !')
    },
  })
}
