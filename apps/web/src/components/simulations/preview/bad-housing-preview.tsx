'use client'

import { FC, useMemo } from 'react'
import { useBadHousingSettings } from '~/app/(authenticated)/simulation/[id]/modifier/mal-logement/simulation-scenario-bad-housing-modification-provider'
import { SimulationPreview } from '~/components/simulations/preview/simulation-preview'
import { SimulationPreviewPayload } from '~/hooks/use-simulation-preview'

export const BadHousingPreview: FC = () => {
  const { badHousingSettings } = useBadHousingSettings()

  const payload = useMemo<SimulationPreviewPayload>(
    () => ({
      simulationId: badHousingSettings.simulationId,
      scenario: {
        b1_horizon_resorption: badHousingSettings.horizon,
        b11_etablissement: badHousingSettings.horsLogement.accommodationTypes,
        b11_fortune: badHousingSettings.horsLogement.fortune,
        b11_hotel: badHousingSettings.horsLogement.hotel,
        b11_part_etablissement: badHousingSettings.horsLogement.part,
        b11_sa: badHousingSettings.horsLogement.sa,
        source_b11: badHousingSettings.horsLogement.source,
        b12_cohab_interg_subie: badHousingSettings.heberges.part,
        b12_heberg_particulier: badHousingSettings.heberges.particular,
        b12_heberg_temporaire: badHousingSettings.heberges.temporary,
        b13_acc: badHousingSettings.inadequationFinanciere.accedant,
        b13_plp: badHousingSettings.inadequationFinanciere.plp,
        b13_taux_effort: badHousingSettings.inadequationFinanciere.maxEffort,
        b13_taux_reallocation: badHousingSettings.inadequationFinanciere.part,
        b14_confort: badHousingSettings.badQuality.confort,
        b14_occupation: badHousingSettings.badQuality.occupation,
        b14_qualite: badHousingSettings.badQuality.qualite,
        b14_taux_reallocation: badHousingSettings.badQuality.part,
        source_b14: badHousingSettings.badQuality.source,
        b15_loc_hors_hlm: badHousingSettings.suroccupation.plp,
        b15_proprietaire: badHousingSettings.suroccupation.proprietaire,
        b15_surocc: badHousingSettings.suroccupation.surocc,
        b15_taux_reallocation: badHousingSettings.suroccupation.part,
        source_b15: badHousingSettings.suroccupation.source,
      },
    }),
    [badHousingSettings],
  )

  return <SimulationPreview payload={payload} />
}
