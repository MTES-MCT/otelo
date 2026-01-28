import { ValidationDemographicOmphale } from '~/app/(authenticated)/simulation/[id]/modifier/(demographic-modification)/validation-parametrage/validation-demographic-omphale'
import { ValidationProjection } from '~/app/(authenticated)/simulation/[id]/modifier/(demographic-modification)/validation-parametrage/validation-projection'
import { UpdateSimulationForm } from '~/components/simulations/settings/update-simulation-form'
import { ModifyValidationAccommodationsSettingsRates } from '~/components/simulations/validation-settings/modify-validation-accommodation-rates'
import { ModifyValidationRestructurationDisparitionRates } from '~/components/simulations/validation-settings/modify-validation-restructuration-disparition-rates'
import { getGroupedSimulationWithResults } from '~/server-only/simulation/get-grouped-simulations-with-results'
import type { SimulationPageProps } from '~/types/simulation-page-props'
import styles from './validation-parametrage.module.css'

export default async function ValidationParametrage({ params }: SimulationPageProps) {
  const { id } = await params
  const { simulations: groupedSimulations } = await getGroupedSimulationWithResults(id)
  const simulation = groupedSimulations[id]
  const epcisCodes = simulation.scenario.epciScenarios.map((e) => e.epciCode)

  return (
    <div className={styles.container}>
      <h3>Récapitulatif des paramètres</h3>
      <div className={styles.subContainer}>
        <h4>Horizon temporel</h4>
        <div className={styles.settingsContainer}>
          <ValidationProjection />
        </div>
      </div>
      <div className={styles.subContainer}>
        <h4>Projection d&apos;évolution démographique</h4>
        <ValidationDemographicOmphale />
      </div>
      <ModifyValidationAccommodationsSettingsRates epcis={epcisCodes} />
      <ModifyValidationRestructurationDisparitionRates epcis={epcisCodes} />
      <UpdateSimulationForm id={id} />
    </div>
  )
}
