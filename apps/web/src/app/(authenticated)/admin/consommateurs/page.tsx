import { notFound } from 'next/navigation'
import { ConsumersManagement } from '~/components/admin/consumers/consumers-management'
import { getSession } from '~/lib/auth/server'

export default async function ConsumersPage() {
  const session = await getSession()

  if (!session || session.user.role !== 'ADMIN') {
    return notFound()
  }

  return (
    <div className="fr-px-4w fr-py-10v">
      <h1>Consommateurs API</h1>
      <ConsumersManagement />
    </div>
  )
}
