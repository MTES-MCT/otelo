'use client'

import { buildEstimationBreakdown, isEpciCountedInTotal } from '@otelo/shared'
import { parseAsInteger, parseAsString, useQueryStates } from 'nuqs'
import { FC } from 'react'
import { useEpcisRates } from '~/app/(authenticated)/simulation/(creation)/(rates-provider)/rates-provider'
import { useCreationPreviewPayload } from '~/hooks/use-creation-preview-payload'
import { useEstimationScope } from '~/hooks/use-estimation-scope'
import { useEstimationTerritory } from '~/hooks/use-estimation-territory'
import { useSimulationPreview } from '~/hooks/use-simulation-preview'
import { useWizardStep } from '../use-wizard-step'
import { buildScenarioRowDetails, ScenarioEstimation } from './scenario-estimation'
import { ScenarioPanel, ScenarioPeriod } from './scenario-panel'
import { ScenarioTerritory } from './scenario-territory'

export const CreationScenarioPanel: FC = () => {
  const [{ millesime, omphale, population, projection }] = useQueryStates({
    millesime: parseAsString,
    omphale: parseAsString,
    population: parseAsString,
    projection: parseAsInteger,
  })
  const { hasReached } = useWizardStep()
  const { rates } = useEpcisRates()
  const { epcis, payload, enabled } = useCreationPreviewPayload()
  const { epciOptions } = useEstimationTerritory(epcis)
  const { scopedEpciCode, setScope } = useEstimationScope(epcis)

  // Sans projection choisie, l'API retomberait sur ses scénarios par défaut : le chiffre affiché ne
  // serait pas celui de l'utilisateur. On ne le demande donc même pas.
  const hasDemographicChoice = Boolean(population && omphale)
  const showsEstimation = hasReached('parametrages-demographique')
  const { data, isFetching, error } = useSimulationPreview(payload, { enabled: enabled && hasDemographicChoice && showsEstimation })

  const showsPeriod = hasReached('cadrage-temporel') && Boolean(projection)
  const showsTerritory = epciOptions.length > 0

  if (!showsPeriod && !showsTerritory) {
    return <ScenarioPanel anchor="scenario-panel" />
  }

  const displayedEpciCode = scopedEpciCode ?? (epciOptions.length === 1 ? epciOptions[0].code : null)
  const rowDetails = buildScenarioRowDetails(omphale, displayedEpciCode ? rates[displayedEpciCode] : null)

  const renderEstimation = () => {
    if (!showsEstimation) return null

    const commonProps = { epciOptions, onScopeChange: setScope, rowDetails, scopedEpciCode }

    if (!hasDemographicChoice) {
      return <ScenarioEstimation breakdown={null} isStale={false} {...commonProps} />
    }

    // Tant qu'aucun résultat n'est arrivé — et en cas d'échec — on n'affiche rien : un paramétrage en
    // cours n'a pas à porter un message d'erreur technique.
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
      {showsPeriod && <ScenarioPeriod start={millesime} end={projection} />}
      {showsTerritory && <ScenarioTerritory epciNames={epciOptions.map((epci) => epci.name)} />}
      {renderEstimation()}
    </ScenarioPanel>
  )
}
