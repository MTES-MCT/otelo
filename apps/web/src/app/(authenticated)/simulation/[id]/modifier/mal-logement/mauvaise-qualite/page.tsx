import { fr } from '@codegouvfr/react-dsfr'
import Alert from '@codegouvfr/react-dsfr/Alert'
import { SelectBadQualityPart } from '~/components/simulations/settings/modification/mal-logement/bad-quality/select-bad-quality-part'
import { SelectBadQualitySource } from '~/components/simulations/settings/modification/mal-logement/bad-quality/select-bad-quality-source'
import { SelectConfortSource } from '~/components/simulations/settings/modification/mal-logement/bad-quality/select-confort-source'
import { SelectOccupationSource } from '~/components/simulations/settings/modification/mal-logement/bad-quality/select-occupation-source'
import { UpdateBadHousingSimulationForm } from '~/components/simulations/settings/modification/mal-logement/update-bad-housing-simulation-form'
import { NextStepLinkWithoutValidation } from '~/components/simulations/settings/next-step-link'
import type { SimulationPageProps } from '~/types/simulation-page-props'
import styles from './mauvaise-qualite.module.css'

export default async function BadQualityPage({ params }: SimulationPageProps) {
  const { id } = await params
  const href = `/simulation/${id}/modifier/mal-logement/suroccupation`

  return (
    <div className={styles.container}>
      <h5>Choix de la source et des critères retenus</h5>
      <SelectBadQualitySource />
      <SelectConfortSource />
      <SelectOccupationSource />
      <Alert
        severity="info"
        description={
          <>
            <p>
              Une part des logements de mauvaise qualité peut faire l&apos;objet d&apos;une rénovation. Plus la part de logements rénovés
              est importante, plus le besoin lié à la mauvaise qualité des logements diminuera.
            </p>
            <p>Par défaut elle s&apos;élève à 50%.</p>
          </>
        }
        small
      />
      <SelectBadQualityPart />
      <div className="fr-flex fr-flex-gap-2v fr-my-1w">
        <div className={fr.cx('fr-ml-auto')}>
          <NextStepLinkWithoutValidation href={href} />
        </div>
        <UpdateBadHousingSimulationForm />
      </div>
    </div>
  )
}
