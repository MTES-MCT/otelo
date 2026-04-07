import { ResetPasswordForm } from '~/components/auth/reset-password-form'

interface ModificationMotDePassePageProps {
  searchParams: Promise<{
    token?: string
    email?: string
  }>
}

export default async function ModificationMotDePassePage({ searchParams }: ModificationMotDePassePageProps) {
  const { token, email } = await searchParams

  return (
    <div className="fr-container fr-py-6w">
      <div className="fr-grid-row fr-grid-row--center">
        <div className="fr-col-12 fr-col-md-8 fr-col-lg-6">
          <ResetPasswordForm token={token} email={email} />
        </div>
      </div>
    </div>
  )
}
