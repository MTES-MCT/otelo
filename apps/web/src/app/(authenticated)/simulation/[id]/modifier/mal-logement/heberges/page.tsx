import { fr } from '@codegouvfr/react-dsfr'
import Alert from '@codegouvfr/react-dsfr/Alert'
import { SelectHebergesAccommodationTypes } from '~/components/simulations/settings/modification/mal-logement/heberges/select-heberges-accommodation-types'
import { SelectHebergesPart } from '~/components/simulations/settings/modification/mal-logement/heberges/select-heberges-part'
import { UpdateBadHousingSimulationForm } from '~/components/simulations/settings/modification/mal-logement/update-bad-housing-simulation-form'
import { NextStepLinkWithoutValidation } from '~/components/simulations/settings/next-step-link'
import type { SimulationPageProps } from '~/types/simulation-page-props'
import styles from './heberges.module.css'

export default async function HebergesPage({ params }: SimulationPageProps) {
  const { id } = await params
  const href = `/simulation/${id}/modifier/mal-logement/inadequation-financiere`

  return (
    <div className={styles.container}>
      <Alert
        severity="info"
        description={
          <>
            Dans la composante « hébergés », Otelo prend en compte les personnes vivant dans un logement qui n’est pas le leur. Deux
            situations sont distinguées :
            <ul>
              <li>les personnes logées chez un parent ou un enfant (cohabitation intergénérationnelle)</li>
              <li>les personnes hébergées chez un tiers sans lien de parenté direct.</li>
            </ul>
          </>
        }
        small
      />
      <div>
        <h5>Cohabitation intergénérationnelle présumée subie</h5>
        <Alert
          severity="info"
          description={
            <>
              La cohabitation intergénérationnelle (enfants de plus de 25 ans vivant chez leurs parents) peut être choisie, mais elle est
              parfois subie et relever du mal-logement. Otelo s’appuie sur une publication <span className="fr-text--bold">SDES</span> pour
              estimer ces situations dites « présumées subies » (voir rubrique Guide d’utilisation). Toutes ne se traduisent cependant pas
              par un besoin en logement (colocation, départ en couple, etc.). Vous pouvez donc définir la part de ces situations qui
              génèrent réellement un besoin sur votre territoire.
            </>
          }
          small
        />
        <div className="fr-my-2w">
          <SelectHebergesPart />
        </div>
      </div>
      <div>
        <h5>Cohabitation chez un tiers</h5>
        <Alert
          severity="info"
          description={
            <>
              La source utilisée ici est le Système National d’Enregistrement (SNE), qui permet d’identifier plusieurs situations de
              cohabitation subie :
              <ul>
                <li>les personnes hébergées chez un particulier ;</li>
                <li>les personnes logées à titre gratuit ;</li>
              </ul>
              Par défaut, toutes les situations de cohabitation chez un tiers génèrent un besoin de logement supplémentaire.
            </>
          }
          small
        />
        <div className="fr-my-2w">
          <SelectHebergesAccommodationTypes />
        </div>
        <div className="fr-flex fr-flex-gap-2v fr-my-1w">
          <div className={fr.cx('fr-ml-auto')}>
            <NextStepLinkWithoutValidation href={href} />
          </div>
          <UpdateBadHousingSimulationForm />
        </div>
      </div>
    </div>
  )
}
