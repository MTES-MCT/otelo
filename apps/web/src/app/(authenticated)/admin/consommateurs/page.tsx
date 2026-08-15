import type { Metadata } from 'next'
import { ConsumersManagement } from '~/components/admin/consumers/consumers-management'
import { AdminPageHeader } from '~/components/admin/shared/admin-page-header'

export const metadata: Metadata = {
  title: 'Consommateurs API',
}

export default function ConsumersPage() {
  return (
    <>
      <AdminPageHeader
        icon="fr-icon-key-line"
        subtitle="Clés d'accès à l'API publique : création, révocation et régénération."
        title="Consommateurs API"
      />
      <ConsumersManagement />
    </>
  )
}
