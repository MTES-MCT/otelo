'use client'

import { fr } from '@codegouvfr/react-dsfr'
import Button from '@codegouvfr/react-dsfr/Button'
import classNames from 'classnames'
import { usePathname } from 'next/navigation'
import React, { useState } from 'react'
import { useSimulationSettings } from '~/app/(authenticated)/simulation/[id]/modifier/(demographic-modification)/simulation-scenario-modification-provider'
import { DemographicTargetTag } from '~/components/simulations/creation-guide/demographic-settings-creation-guide-tag'
import { useBassinEpcis } from '~/hooks/use-bassin-epcis'
import { useEpcis } from '~/hooks/use-epcis'
import { DemographicSettingsSimulationSideMenuStepNumber } from '../demographic-settings-simulation-side-menu-step-number'
import { DemographicSettingsSimulationSideMenuTitle } from '../demographic-settings-simulation-side-menu-title'
import styles from '../simulation-side-menu.module.css'
import { UpdateDemographicSettingsGuideTag } from './update-demographic-settings-guide-tag'

const MAX_EPCIS_DISPLAYED = 2

type UpdateDemographicSettingsSimulationSideMenuProps = {
  id: string
}

export default function UpdateDemographicSettingsSimulationSideMenu({ id }: UpdateDemographicSettingsSimulationSideMenuProps) {
  const { simulationSettings } = useSimulationSettings()
  const pathname = usePathname()

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

  // Determine current step index based on pathname
  const getCurrentStepIndex = () => {
    if (pathname.includes('cadrage-temporel')) return 0
    if (pathname.includes('parametrages-demographique')) return 1
    if (pathname.includes('taux-cibles-logements-vacants')) return 2
    if (pathname.includes('taux-cibles-residences-secondaires')) return 3
    if (pathname.includes('taux-restructuration-disparition')) return 4
    if (pathname.includes('resultats')) return 5 // After all steps
    return -1
  }

  const currentStepIndex = getCurrentStepIndex()

  const demographicSteps = [
    {
      path: `/simulation/${id}/modifier/cadrage-temporel`,
      queryKeys: ['projection'],
      titleText: 'Horizon de temps',
      iconId: 'ri-time-line',
      data: `${simulationSettings.projection}`,
    },
    {
      path: `/simulation/${id}/modifier/parametrages-demographique`,
      queryKeys: ['omphale'],
      titleText: 'Projection démographique',
      data: simulationSettings.b2_scenario,
    },
    {
      path: `/simulation/${id}/modifier/taux-cibles-logements-vacants`,
      queryKeys: [],
      titleText: 'Logements vacants longue durée',
    },
    {
      path: `/simulation/${id}/modifier/taux-cibles-residences-secondaires`,
      queryKeys: [],
      titleText: 'Résidences secondaires',
    },
    {
      path: `/simulation/${id}/modifier/taux-restructuration-disparition`,
      queryKeys: [],
      titleText: 'Renouvellement urbain',
    },
  ]

  return (
    <nav className={fr.cx('fr-col-md-3')}>
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
                  {index === 2 && currentStepIndex > 2 && epcis && epcis.length > 0 && rates && (
                    <>
                      {(showAllVacancy ? epcis : epcis.slice(0, MAX_EPCIS_DISPLAYED)).map((epci) => {
                        const epciRates = rates[epci.code]
                        if (!epciRates) return null
                        return (
                          <div key={epci.code} className={styles.epciRateContainer}>
                            <DemographicTargetTag
                              step={{ path: step.path, value: epci.name, disabled: false, iconId: 'ri-map-pin-line' }}
                            />
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
                  {index === 3 && currentStepIndex > 3 && epcis && epcis.length > 0 && rates && (
                    <>
                      {(showAllSecondary ? epcis : epcis.slice(0, MAX_EPCIS_DISPLAYED)).map((epci) => {
                        const epciRates = rates[epci.code]
                        if (!epciRates) return null
                        return (
                          <div key={epci.code} className={styles.epciRateContainer}>
                            <DemographicTargetTag
                              step={{ path: step.path, value: epci.name, disabled: false, iconId: 'ri-map-pin-line' }}
                            />
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
                  {index === 4 && currentStepIndex > 4 && epcis && epcis.length > 0 && rates && (
                    <>
                      {(showAllRestructuration ? epcis : epcis.slice(0, MAX_EPCIS_DISPLAYED)).map((epci) => {
                        const epciRates = rates[epci.code]
                        if (!epciRates) return null
                        return (
                          <div key={epci.code} className={styles.epciRateContainer}>
                            <DemographicTargetTag
                              step={{ path: step.path, value: epci.name, disabled: false, iconId: 'ri-map-pin-line' }}
                            />
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
    </nav>
  )
}
