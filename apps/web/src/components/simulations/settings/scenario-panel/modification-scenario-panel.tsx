'use client'

import { buildEstimationBreakdown, isEpciCountedInTotal } from '@otelo/shared'
import { FC } from 'react'
import { useSimulationSettings } from '~/app/(authenticated)/simulation/[id]/modifier/(demographic-modification)/simulation-scenario-modification-provider'
import { useEstimationScope } from '~/hooks/use-estimation-scope'
import { useModifyPreviewPayload } from '~/hooks/use-modify-preview-payload'
import { useSimulationPreview } from '~/hooks/use-simulation-preview'
import { buildScenarioRowDetails, ScenarioEstimation } from './scenario-estimation'
import { ScenarioPanel, ScenarioPeriod } from './scenario-panel'
import { ScenarioTerritory } from './scenario-territory'

type ModificationScenarioPanelProps = {
  /** EPCI de la simulation, fournis par le serveur : le contexte de paramétrage ne porte que les taux. */
  epciOptions: Array<{ code: string; name: string }>
}

/** En modification, tout est déjà paramétré : la colonne est remplie dès la première étape. */
export const ModificationScenarioPanel: FC<ModificationScenarioPanelProps> = ({ epciOptions }) => {
  const { simulationSettings } = useSimulationSettings()
  const payload = useModifyPreviewPayload()
  const { scopedEpciCode, setScope } = useEstimationScope(epciOptions.map((epci) => epci.code))

  // Le scénario vient de la base et est toujours renseigné ; la règle est la même qu'en création,
  // pour que la colonne ne puisse jamais afficher une projection démographique implicite.
  const hasDemographicChoice = Boolean(simulationSettings.b2_scenario)
  const { data, isFetching, error } = useSimulationPreview(payload, { enabled: hasDemographicChoice })

  const displayedEpciCode = scopedEpciCode ?? (epciOptions.length === 1 ? epciOptions[0].code : null)
  const rowDetails = buildScenarioRowDetails(
    simulationSettings.b2_scenario,
    displayedEpciCode ? simulationSettings.epciScenarios[displayedEpciCode] : null,
  )
  const commonProps = { epciOptions, onScopeChange: setScope, rowDetails, scopedEpciCode }

  const renderEstimation = () => {
    if (!hasDemographicChoice) {
      return <ScenarioEstimation breakdown={null} isStale={false} {...commonProps} />
    }

    if (error || !data) {
      return null
    }

    return (
      <ScenarioEstimation
        breakdown={buildEstimationBreakdown(data, { epciCode: scopedEpciCode })}
        isScopedEpciExcluded={Boolean(scopedEpciCode) && !isEpciCountedInTotal(data, scopedEpciCode as string)}
        isStale={isFetching}
        {...commonProps}
      />
    )
  }

  return (
    <ScenarioPanel anchor="scenario-panel">
      <ScenarioPeriod start={simulationSettings.millesime} end={simulationSettings.projection ?? null} />
      <ScenarioTerritory epciNames={epciOptions.map((epci) => epci.name)} />
      {renderEstimation()}
    </ScenarioPanel>
  )
}
