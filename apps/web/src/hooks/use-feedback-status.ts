import { useQuery } from '@tanstack/react-query'

interface FeedbackStatus {
  status: 'SNOOZED' | 'SUBMITTED' | null
  hasSimulations: boolean
}

export const useFeedbackStatus = () => {
  const getFeedbackStatus = async (): Promise<FeedbackStatus> => {
    const response = await fetch('/api/feedback/status')

    if (!response.ok) {
      throw new Error('Failed to fetch feedback status')
    }

    return response.json()
  }

  const { data, isLoading } = useQuery({
    queryFn: getFeedbackStatus,
    queryKey: ['feedback-status'],
  })

  return { data, isLoading }
}
