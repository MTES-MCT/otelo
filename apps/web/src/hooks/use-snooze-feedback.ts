import { useMutation, useQueryClient } from '@tanstack/react-query'

export const useSnoozeFeedback = () => {
  const queryClient = useQueryClient()

  const snoozeFeedback = async () => {
    const response = await fetch('/api/feedback/snooze', {
      method: 'POST',
    })

    if (!response.ok) {
      throw new Error('Failed to snooze feedback')
    }

    return response.json()
  }

  return useMutation({
    mutationFn: snoozeFeedback,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feedback-status'] })
    },
  })
}
