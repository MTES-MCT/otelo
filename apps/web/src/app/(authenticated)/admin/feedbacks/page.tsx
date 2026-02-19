import { redirect } from 'next/navigation'
import { FeedbacksContent } from '~/components/admin/feedbacks/feedbacks-content'
import { authFetch, getSession } from '~/lib/auth/server'

interface FeedbacksPageProps {
  searchParams: Promise<{ startDate?: string; endDate?: string }>
}

export default async function FeedbacksPage({ searchParams }: FeedbacksPageProps) {
  const session = await getSession()
  if (!session || session.user.role !== 'ADMIN') {
    redirect('/accueil')
  }

  const { startDate, endDate } = await searchParams

  const params = new URLSearchParams()
  if (startDate) params.set('startDate', startDate)
  if (endDate) params.set('endDate', endDate)

  const queryString = params.toString()
  const res = await authFetch(`/feedback/admin/list${queryString ? `?${queryString}` : ''}`)

  if (!res.ok) {
    throw new Error(`Failed to fetch feedbacks: ${res.status}`)
  }

  const feedbacks = await res.json()

  return <FeedbacksContent feedbacks={feedbacks} startDate={startDate} endDate={endDate} />
}
