import { notFound } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { UsersTable } from '~/components/admin/users/users-table'
import { UsersTableHeader } from '~/components/admin/users/users-table-header'
import { authOptions } from '~/lib/auth/auth.config'
import { TSession } from '~/types/next-auth'

export default async function AdminPage() {
  const session = (await getServerSession(authOptions)) as TSession

  if (session.user.role !== 'ADMIN') {
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
