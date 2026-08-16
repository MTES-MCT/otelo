import type { Metadata } from 'next'
import { AdminPageHeader } from '~/components/admin/shared/admin-page-header'
import { UsersManagement } from '~/components/admin/users/users-management'

export const metadata: Metadata = {
  title: 'Utilisateurs',
}

export default function UsersPage() {
  return (
    <>
      <AdminPageHeader
        icon="fr-icon-user-line"
        subtitle="Octroi d'accès, import et export du référentiel utilisateurs, usurpation d'identité."
        title="Utilisateurs"
      />
      <UsersManagement />
    </>
  )
}
