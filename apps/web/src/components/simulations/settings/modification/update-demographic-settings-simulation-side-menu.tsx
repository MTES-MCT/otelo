'use client'

import Button from '@codegouvfr/react-dsfr/Button'
import classNames from 'classnames'
import React, { useState } from 'react'
import { useSimulationSettings } from '~/app/(authenticated)/simulation/[id]/modifier/(demographic-modification)/simulation-scenario-modification-provider'
import { DemographicTargetTag } from '~/components/simulations/creation-guide/demographic-settings-creation-guide-tag'
import { useBassinEpcis } from '~/hooks/use-bassin-epcis'
import { useEpcis } from '~/hooks/use-epcis'
import { DemographicSettingsSimulationSideMenuStepNumber } from '../demographic-settings-simulation-side-menu-step-number'
import { DemographicSettingsSimulationSideMenuTitle } from '../demographic-settings-simulation-side-menu-title'
import styles from '../simulation-side-menu.module.css'
import { buildStepPath, MODIFICATION_STEPS, WizardStepSlug } from '../wizard-steps'
import { UpdateDemographicSettingsGuideTag } from './update-demographic-settings-guide-tag'

const MAX_EPCIS_DISPLAYED = 2

type UpdateDemographicSettingsSimulationSideMenuProps = {
  id: string
}

export default function UpdateDemographicSettingsSimulationSideMenu({ id }: UpdateDemographicSettingsSimulationSideMenuProps) {
  const { simulationSettings } = useSimulationSettings()

  // States for "Voir plus" buttons
  const [showAllVacancy, setShowAllVacancy] = useState(false)
  const [showAllSecondary, setShowAllSecondary] = useState(false)
  const [showAllRestructuration, setShowAllRestructuration] = useState(false)

  // Get rates from simulation settings
  const rates = simulationSettings.epciScenarios

  // Get EPCI codes from simulation settings
  const epciCodes = simulationSettings.epciScenarios ? Object.keys(simulationSettings.epciScenarios) : []
  const { data: epcisList } = useEpcis(epciCodes)
  const { data: bassinEpcis } = useBassinEpcis()

  // Get EPCIs with names
  const epcis = epciCodes.map((code) => ({
    code,
    name: [...(epcisList || []), ...(bassinEpcis || [])]?.find((epci) => epci.code === code)?.name || code,
  }))

  // Récapitulatif affiché sous les étapes déjà paramétrées.
  const stepData: Partial<Record<WizardStepSlug, string | undefined>> = {
    'cadrage-temporel': `${simulationSettings.projection}`,
    'parametrages-demographique': simulationSettings.b2_scenario,
  }

  const demographicSteps = MODIFICATION_STEPS.map((step) => ({
    data: stepData[step.slug],
    iconId: step.iconId,
    path: buildStepPath(step.slug, 'modification', id),
    queryKeys: step.queryKeys,
    titleText: step.shortTitle,
  }))

  return (
    <div className={styles.container}>
      {demographicSteps.map((step, index) => (
        <React.Fragment key={index}>
          <div className={styles.stepContainer}>
            <DemographicSettingsSimulationSideMenuStepNumber stepNumber={index + 1} path={step.path} allSteps={demographicSteps} />
            <DemographicSettingsSimulationSideMenuTitle
              title={step.titleText}
              path={step.path}
              stepNumber={index + 1}
              allSteps={demographicSteps}
            />
          </div>
          {index !== demographicSteps.length && (
            <div className={classNames(index !== demographicSteps.length - 1 && styles.stepDelimitor)}>
              <div className={styles.badgeContainer}>
                <UpdateDemographicSettingsGuideTag step={step} />
                {/* Étape 2: Logements vacants longue durée - Afficher si on est après cette étape */}
                {index === 2 && epcis.length > 0 && (
                  <>
                    {(showAllVacancy ? epcis : epcis.slice(0, MAX_EPCIS_DISPLAYED)).map((epci) => {
                      const epciRates = rates[epci.code]
                      if (!epciRates) return null
                      return (
                        <div key={epci.code} className={styles.epciRateContainer}>
                          <DemographicTargetTag step={{ path: step.path, value: epci.name, disabled: false, iconId: 'ri-map-pin-line' }} />
                          <div className={styles.epciTag}>
                            <span className={classNames(styles.iconEpciTag, 'ri-arrow-right-line')} />
                            Taux cible : {(epciRates.longTermVacancyRate * 100).toFixed(2)} %
                          </div>
                        </div>
                      )
                    })}
                    {epcis.length > MAX_EPCIS_DISPLAYED && (
                      <Button
                        type="button"
                        priority="secondary"
                        size="small"
                        className={styles.seeMore}
                        onClick={() => setShowAllVacancy(!showAllVacancy)}
                      >
                        {showAllVacancy ? 'Voir moins' : `Voir plus (${epcis.length - MAX_EPCIS_DISPLAYED})`}
                      </Button>
                    )}
                  </>
                )}
                {/* Étape 3: Résidences secondaires - Afficher si on est après cette étape */}
                {index === 3 && epcis.length > 0 && (
                  <>
                    {(showAllSecondary ? epcis : epcis.slice(0, MAX_EPCIS_DISPLAYED)).map((epci) => {
                      const epciRates = rates[epci.code]
                      if (!epciRates) return null
                      return (
                        <div key={epci.code} className={styles.epciRateContainer}>
                          <DemographicTargetTag step={{ path: step.path, value: epci.name, disabled: false, iconId: 'ri-map-pin-line' }} />
                          <div className={styles.epciTag}>
                            <span className={classNames(styles.iconEpciTag, 'ri-arrow-right-line')} />
                            Taux cible : {(epciRates.txRs * 100).toFixed(2)} %
                          </div>
                        </div>
                      )
                    })}
                    {epcis.length > MAX_EPCIS_DISPLAYED && (
                      <Button
                        type="button"
                        priority="secondary"
                        size="small"
                        className={styles.seeMore}
                        onClick={() => setShowAllSecondary(!showAllSecondary)}
                      >
                        {showAllSecondary ? 'Voir moins' : `Voir plus (${epcis.length - MAX_EPCIS_DISPLAYED})`}
                      </Button>
                    )}
                  </>
                )}
                {/* Étape 4: Renouvellement urbain - Afficher si on est après cette étape */}
                {index === 4 && epcis.length > 0 && (
                  <>
                    {(showAllRestructuration ? epcis : epcis.slice(0, MAX_EPCIS_DISPLAYED)).map((epci) => {
                      const epciRates = rates[epci.code]
                      if (!epciRates) return null
                      return (
                        <div key={epci.code} className={styles.epciRateContainer}>
                          <DemographicTargetTag step={{ path: step.path, value: epci.name, disabled: false, iconId: 'ri-map-pin-line' }} />
                          <div className={styles.epciTag}>
                            <span className={classNames(styles.iconEpciTag, 'ri-arrow-right-line')} />
                            Restructuration : {(epciRates.restructuringRate * 100).toFixed(2)} %
                          </div>
                          <div className={styles.epciTag}>
                            <span className={classNames(styles.iconEpciTag, 'ri-arrow-right-line')} />
                            Disparition : {(epciRates.disappearanceRate * 100).toFixed(2)} %
                          </div>
                        </div>
                      )
                    })}
                    {epcis.length > MAX_EPCIS_DISPLAYED && (
                      <Button
                        type="button"
                        priority="secondary"
                        size="small"
                        onClick={() => setShowAllRestructuration(!showAllRestructuration)}
                      >
                        {showAllRestructuration ? 'Voir moins' : `Voir plus (${epcis.length - MAX_EPCIS_DISPLAYED})`}
                      </Button>
                    )}
                  </>
                )}
              </div>
            </div>
          )}
        </React.Fragment>
      ))}
    </div>
  )
}
