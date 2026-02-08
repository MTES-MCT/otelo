import { notFound } from 'next/navigation'
import { UsersTable } from '~/components/admin/users/users-table'
import { UsersTableHeader } from '~/components/admin/users/users-table-header'
import { getSession } from '~/lib/auth/server'

export const dynamic = 'force-dynamic'

export default async function AdminPage() {
  const session = await getSession()

  if (!session || session.user.role !== 'ADMIN') {
    return notFound()
  }

  return (
    <div className="fr-container fr-py-10v">
      <h1>Gestion des utilisateurs</h1>
      <UsersTableHeader />
      <UsersTable />
    </div>
  )
}
