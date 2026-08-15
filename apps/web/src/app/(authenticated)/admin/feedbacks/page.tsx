import type { Metadata } from 'next'
import { FeedbacksContent } from '~/components/admin/feedbacks/feedbacks-content'
import { AdminPageHeader } from '~/components/admin/shared/admin-page-header'
import { authFetch } from '~/lib/auth/server'

export const metadata: Metadata = {
  title: 'Retours utilisateurs',
}

interface FeedbacksPageProps {
  searchParams: Promise<{ startDate?: string; endDate?: string }>
}

export default async function FeedbacksPage({ searchParams }: FeedbacksPageProps) {
  const { endDate, startDate } = await searchParams

  const params = new URLSearchParams()
  if (startDate) params.set('startDate', startDate)
  if (endDate) params.set('endDate', endDate)

  const queryString = params.toString()
  const res = await authFetch(`/feedback/admin/list${queryString ? `?${queryString}` : ''}`)

  if (!res.ok) {
    throw new Error(`Failed to fetch feedbacks: ${res.status}`)
  }

  const feedbacks = await res.json()

  return (
    <>
      <AdminPageHeader
        icon="fr-icon-questionnaire-line"
        subtitle="Notes de satisfaction et commentaires laissés par les utilisateurs."
        title="Retours utilisateurs"
      />
      <FeedbacksContent endDate={endDate} feedbacks={feedbacks} startDate={startDate} />
    </>
  )
}
