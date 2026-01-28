import { fr } from '@codegouvfr/react-dsfr'
import Alert from '@codegouvfr/react-dsfr/Alert'
import { SelectAccommodationTypes } from '~/components/simulations/settings/modification/mal-logement/hors-logement/select-accommodation-types'
import { SelectNoAccomodationPart } from '~/components/simulations/settings/modification/mal-logement/hors-logement/select-no-accommodation-part'
import { SelectNoAccommodationSource } from '~/components/simulations/settings/modification/mal-logement/hors-logement/select-no-accommodation-source'
import { UpdateBadHousingSimulationForm } from '~/components/simulations/settings/modification/mal-logement/update-bad-housing-simulation-form'
import { NextStepLinkWithoutValidation } from '~/components/simulations/settings/next-step-link'
import type { SimulationPageProps } from '~/types/simulation-page-props'
import styles from './hors-logement.module.css'

export default async function HorsLogementPage({ params }: SimulationPageProps) {
  const { id } = await params
  const href = `/simulation/${id}/modifier/mal-logement/heberges`

  return (
    <div className={styles.container}>
      <div>
        <h5>Sans abris - Habitations de fortune - Logés à l&apos;hôtel</h5>
        <Alert
          severity="info"
          description={
            <>
              Deux sources sont disponibles :
              <ul>
                <li>INSEE : estimation des personnes sans domicile ou en habitat de fortune via le recensement.</li>
                <li>SNE : ménages demandeurs de logement social déclarant un hébergement précaire (sans-abri, hôtel, squat, camping).</li>
              </ul>
            </>
          }
          small
        />
        <div className="fr-my-2w">
          <SelectNoAccommodationSource />
        </div>
        Par défaut, toutes ces situations génèrent un besoin de logement supplémentaire.
      </div>
      <div>
        <h5>Hébergement social</h5>
        <SelectAccommodationTypes />
        <SelectNoAccomodationPart />
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
