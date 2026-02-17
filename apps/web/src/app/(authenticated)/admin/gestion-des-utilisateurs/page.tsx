import { notFound } from 'next/navigation'
import { UsersManagement } from '~/components/admin/users/users-management'
import { getSession } from '~/lib/auth/server'

export default async function AdminPage() {
  const session = await getSession()

  if (!session || session.user.role !== 'ADMIN') {
    return notFound()
  }

  return (
    <div className="fr-px-4w fr-py-10v">
      <h1>Gestion des utilisateurs</h1>
      <UsersManagement />
    </div>
  )
}
