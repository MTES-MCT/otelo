import { VerificationClient } from '~/components/auth/verification-client'
import { verifyEmail } from '~/server-only/auth/verify-email'

interface VerificationPageProps {
  searchParams: {
    code: string
    email?: string
  }
}

export default async function VerificationPage({ searchParams }: VerificationPageProps) {
  const { code } = searchParams
  const { message } = await verifyEmail(code)

  return (
    <div className="fr-container fr-py-8w">
      <div className="fr-grid-row fr-grid-row--center">
        <div className="fr-col-12 fr-col-md-8 fr-col-lg-6">
          <VerificationClient code={code} state={message} />
        </div>
      </div>
    </div>
  )
}
