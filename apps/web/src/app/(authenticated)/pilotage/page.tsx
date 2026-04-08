'use client'

import { fr } from '@codegouvfr/react-dsfr'
import PilotageTab from '~/components/admin/pilotage-tab'

export default function PilotagePage() {
  return (
    <div className={fr.cx('fr-container', 'fr-py-10v')}>
      <h1>Pilotage du déploiement</h1>
      <PilotageTab />
    </div>
  )
}
