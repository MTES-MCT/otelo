import { fr } from '@codegouvfr/react-dsfr'
import type { Metadata } from 'next'
import { Suspense } from 'react'
import { AmfQuestionnaire } from '~/components/amf/amf-questionnaire'

export const metadata: Metadata = {
  title: 'Votre besoin en logements en 3 minutes',
  description: "Obtenez une première estimation simplifiée du besoin en logement de votre territoire d'ici 2036.",
}

export default function AmfPage() {
  return (
    <div className={fr.cx('fr-container')}>
      <div className={fr.cx('fr-grid-row', 'fr-grid-row--center')}>
        <div className={fr.cx('fr-col-12', 'fr-col-md-10', 'fr-col-lg-8')}>
          {/* L'autocomplétion lit les paramètres d'URL : la frontière Suspense évite de bloquer le rendu statique. */}
          <Suspense>
            <AmfQuestionnaire />
          </Suspense>
        </div>
      </div>
    </div>
  )
}
