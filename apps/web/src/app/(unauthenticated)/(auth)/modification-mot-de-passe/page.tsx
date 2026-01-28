import { ResetPasswordForm } from '~/components/auth/reset-password-form'
import { validateResetToken } from '~/server-only/auth/validate-reset-token'

interface ModificationMotDePassePageProps {
  searchParams: {
    token?: string
  }
}

export default async function ModificationMotDePassePage({ searchParams }: ModificationMotDePassePageProps) {
  const { token } = searchParams
  const { state } = await validateResetToken(token)

  return (
    <div className="fr-container fr-py-6w">
      <div className="fr-grid-row fr-grid-row--center">
        <div className="fr-col-12 fr-col-md-8 fr-col-lg-6">
          <ResetPasswordForm token={token} tokenState={state} />
        </div>
      </div>
    </div>
  )
}
