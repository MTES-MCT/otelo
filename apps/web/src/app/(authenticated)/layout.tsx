import LayoutWrapper from '~/app/(authenticated)/layout-wrapper'
import { Signout } from '~/app/(authenticated)/signout'
import { UserTypeSelectionModal } from '~/components/auth/user-type-selection-modal'
import { ImpersonationBanner } from '~/components/impersonation-banner'

export default function AuthenticatedLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Signout />
      <ImpersonationBanner />
      <LayoutWrapper>
        {children}
        <UserTypeSelectionModal />
      </LayoutWrapper>
    </>
  )
}
