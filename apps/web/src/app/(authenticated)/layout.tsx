import { redirect } from 'next/navigation'
import LayoutWrapper from '~/app/layout-wrapper'
import { UserTypeSelectionModal } from '~/components/auth/user-type-selection-modal'
import { FeedbackBanner } from '~/components/feedback/feedback-banner'
import { ImpersonationBanner } from '~/components/impersonation-banner'
import { getSession } from '~/lib/auth/server'

export default async function AuthenticatedLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession()

  if (!session) {
    redirect('/connexion')
  }

  if (!session.user.hasAccess && session.user.role !== 'ADMIN') {
    redirect('/unauthorized')
  }

  return (
    <>
      <ImpersonationBanner />
      <LayoutWrapper>
        {children}
        <UserTypeSelectionModal />
        <FeedbackBanner />
      </LayoutWrapper>
    </>
  )
}
