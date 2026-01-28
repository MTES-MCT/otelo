'use client'

import {
  BadHousingSettings,
  BadHousingSettingsProvider,
} from '~/app/(authenticated)/simulation/[id]/modifier/mal-logement/simulation-scenario-bad-housing-modification-provider'
import { useScenario } from '~/hooks/use-scenario'

interface BadHousingSettingsFormContextWrapperProps {
  children: React.ReactNode
}

export const BadHousingSettingsFormContextWrapper = ({ children }: BadHousingSettingsFormContextWrapperProps) => {
  const { data } = useScenario()

  if (!data) return null
  const { id, scenario } = data

  const initialSettings: BadHousingSettings = {
    badQuality: {
      confort: scenario.b14_confort,
      occupation: scenario.b14_occupation,
      part: scenario.b14_taux_reallocation,
      source: scenario.source_b14,
    },
    heberges: {
      part: scenario.b12_cohab_interg_subie,
      particular: scenario.b12_heberg_particulier,
      temporary: scenario.b12_heberg_temporaire,
    },
    horizon: scenario.b1_horizon_resorption,
    horsLogement: {
      accommodationTypes: scenario.b11_etablissement,
      fortune: scenario.b11_fortune,
      hotel: scenario.b11_hotel,
      part: scenario.b11_part_etablissement,
      sa: scenario.b11_sa,
      source: scenario.source_b11,
    },
    id: scenario.id,
    inadequationFinanciere: {
      accedant: scenario.b13_acc,
      maxEffort: scenario.b13_taux_effort,
      part: scenario.b13_taux_reallocation,
      plp: scenario.b13_plp,
    },
    simulationId: id,
    suroccupation: {
      part: scenario.b15_taux_reallocation,
      plp: scenario.b15_loc_hors_hlm,
      proprietaire: scenario.b15_proprietaire,
      source: scenario.source_b15,
      surocc: scenario.b15_surocc,
    },
  }

  return <BadHousingSettingsProvider initialSettings={initialSettings}>{children}</BadHousingSettingsProvider>
}
