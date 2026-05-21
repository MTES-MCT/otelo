import { fr } from '@codegouvfr/react-dsfr'
import { redirect } from 'next/navigation'
import PilotageTab from '~/components/admin/pilotage-tab'
import { getSession } from '~/lib/auth/server'

export default async function PilotagePage() {
  const session = await getSession()
  const isAdmin = session?.user.role === 'ADMIN'
  const isDreal = session?.user.type === 'DREAL'

  if (!isAdmin && !isDreal) {
    redirect('/accueil')
  }

  return (
    <div className={fr.cx('fr-container', 'fr-py-10v')}>
      <PilotageTab />
    </div>
  )
}
