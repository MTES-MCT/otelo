'use client'

import Button from '@codegouvfr/react-dsfr/Button'
import classNames from 'classnames'
import { usePathname } from 'next/navigation'
import { parseAsArrayOf, parseAsString, useQueryState } from 'nuqs'
import React, { useState } from 'react'
import { useEpcisRates } from '~/app/(authenticated)/simulation/(creation)/(rates-provider)/rates-provider'
import {
  DemographicSettingsGuideTag,
  DemographicTargetTag,
} from '~/components/simulations/creation-guide/demographic-settings-creation-guide-tag'
import { useEpcis } from '~/hooks/use-epcis'
import { DemographicSettingsSimulationSideMenuStepNumber } from './demographic-settings-simulation-side-menu-step-number'
import { DemographicSettingsSimulationSideMenuTitle } from './demographic-settings-simulation-side-menu-title'
import styles from './simulation-side-menu.module.css'

const MAX_EPCIS_DISPLAYED = 2

export default function DemographicSettingsSimulationSideMenu() {
  const [epcisParam] = useQueryState('epcis', parseAsArrayOf(parseAsString).withDefault([]))
  const { data: epcis } = useEpcis(epcisParam)
  const pathname = usePathname()

  // Try to get rates if we're in a RatesProvider context
  let rates = null
  try {
    const ratesContext = useEpcisRates()
    rates = ratesContext.rates
  } catch {
    // Not in a RatesProvider context, rates will be null
  }

  // Explicitly check the URL params, not the fetched data
  const epciNames = epcisParam.length > 0 && epcis ? epcis.map((epci) => epci.name) : undefined

  // Determine current step index based on pathname
  const getCurrentStepIndex = () => {
    if (pathname.includes('choix-du-territoire')) return 0
    if (pathname.includes('cadrage-temporel')) return 1
    if (pathname.includes('parametrages-demographique')) return 2
    if (pathname.includes('taux-cibles-logements-vacants')) return 3
    if (pathname.includes('taux-cibles-residences-secondaires')) return 4
    if (pathname.includes('taux-restructuration-disparition')) return 5
    if (pathname.includes('resultats')) return 6 // After all steps
    return -1
  }

  const currentStepIndex = getCurrentStepIndex()

  // States for "Voir plus" buttons
  const [showAllVacancy, setShowAllVacancy] = useState(false)
  const [showAllSecondary, setShowAllSecondary] = useState(false)
  const [showAllRestructuration, setShowAllRestructuration] = useState(false)

  const demographicSteps = [
    {
      data: epciNames && epciNames.length > 0 ? 'Votre territoire' : undefined,
      path: '/simulation/choix-du-territoire',
      queryKeys: ['epci', 'epcis'],
      titleText: 'Choix du territoire',
    },
    {
      path: '/simulation/cadrage-temporel',
      queryKeys: ['projection'],
      titleText: 'Horizon de temps',
      iconId: 'ri-time-line',
    },
    {
      path: '/simulation/parametrages-demographique',
      queryKeys: ['omphale'],
      titleText: 'Projection démographique',
    },
    {
      path: '/simulation/taux-cibles-logements-vacants',
      queryKeys: [],
      titleText: 'Logements vacants longue durée',
    },
    {
      path: '/simulation/taux-cibles-residences-secondaires',
      queryKeys: [],
      titleText: 'Résidences secondaires',
    },
    {
      path: '/simulation/taux-restructuration-disparition',
      queryKeys: [],
      titleText: 'Renouvellement urbain',
    },
  ]

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
                <DemographicSettingsGuideTag step={step} />
                {index === 0 && epciNames && epciNames.length > 0 && (
                  <>
                    {epciNames.map((epciName, epciIndex) => (
                      <div key={epciIndex} className={styles.epciTag}>
                        <span className={classNames(styles.iconEpciTag, 'ri-arrow-right-line')} />
                        <span>{epciName}</span>
                      </div>
                    ))}
                  </>
                )}
                {/* Étape 3: Logements vacants longue durée - Afficher si on est après cette étape */}
                {index === 3 && currentStepIndex > 3 && epcis && epcis.length > 0 && rates && (
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
                {/* Étape 4: Résidences secondaires - Afficher si on est après cette étape */}
                {index === 4 && currentStepIndex > 4 && epcis && epcis.length > 0 && rates && (
                  <>
                    {(showAllSecondary ? epcis : epcis.slice(0, MAX_EPCIS_DISPLAYED)).map((epci) => {
                      const epciRates = rates[epci.code]
                      if (!epciRates) return null
                      return (
                        <div key={epci.code} className={styles.epciRateContainer}>
                          <DemographicTargetTag step={{ path: step.path, value: epci.name, disabled: false, iconId: 'ri-map-pin-line' }} />
                          <div className={styles.epciTag}>
                            <span className={classNames(styles.iconEpciTag, 'ri-arrow-right-line')} />
                            Taux cible : {(epciRates.txRS * 100).toFixed(2)} %
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
                {/* Étape 5: Renouvellement urbain - Afficher si on est après cette étape */}
                {index === 5 && currentStepIndex > 5 && epcis && epcis.length > 0 && rates && (
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
                        priority="secondary"
                        size="small"
                        type="button"
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
