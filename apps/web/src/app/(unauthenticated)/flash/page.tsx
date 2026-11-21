import { fr } from '@codegouvfr/react-dsfr'
import type { Metadata } from 'next'
import { Suspense } from 'react'
import { AmfQuestionnaire } from '~/components/amf/amf-questionnaire'

export const metadata: Metadata = {
  title: "Quels besoins en logements d'ici 2036 ?",
  description: "Découvrez une première estimation des besoins en logements d'ici 2036 à l'échelle de votre intercommunalité.",
}

export default function FlashPage() {
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
