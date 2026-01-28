import { fr } from '@codegouvfr/react-dsfr'
import { Tile } from '@codegouvfr/react-dsfr/Tile'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: "Ressources sur l'urbanisme Otelo",
}

export default function RessourcesPage() {
  return (
    <>
      <h1 className={fr.cx('fr-mb-8v')}>Ressources</h1>

      <div className={fr.cx('fr-grid-row', 'fr-grid-row--gutters')}>
        <div className={fr.cx('fr-col-12', 'fr-col-md-8', 'fr-col-lg-6')}>
          <Tile
            imageUrl="/assets/img/book.svg"
            imageAlt="Illustration"
            small
            orientation="vertical"
            title="Justification de la consommation foncière dans les documents d'urbanisme"
            titleAs="h2"
            desc="Analyse démographique et posture du juge administratif. Cet article explore les enjeux liés à la justification de la consommation d'espace dans les documents d'urbanisme, en se concentrant sur l'analyse démographique et la jurisprudence administrative."
            linkProps={{
              href: 'https://fonciers-en-debat.com/justification-de-la-consommation-fonciere-dans-les-documents-durbanisme-analyse-demographique-et-posture-du-juge-administratif/',
              target: '_blank',
              rel: 'noopener noreferrer',
            }}
          />
        </div>
      </div>
    </>
  )
}
