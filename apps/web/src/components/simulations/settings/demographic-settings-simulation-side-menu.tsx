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
import { buildStepPath, CREATION_STEPS, getSlugFromPathname, getStepIndex } from './wizard-steps'

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

  // Les résultats se situent après la dernière étape : tous les récapitulatifs y sont visibles.
  const currentStepIndex = pathname.includes('resultats') ? CREATION_STEPS.length : getStepIndex(getSlugFromPathname(pathname), 'creation')

  // States for "Voir plus" buttons
  const [showAllVacancy, setShowAllVacancy] = useState(false)
  const [showAllSecondary, setShowAllSecondary] = useState(false)
  const [showAllRestructuration, setShowAllRestructuration] = useState(false)

  const demographicSteps = CREATION_STEPS.map((step) => ({
    data: step.slug === 'choix-du-territoire' && epciNames && epciNames.length > 0 ? 'Votre territoire' : undefined,
    iconId: step.iconId,
    path: buildStepPath(step.slug, 'creation'),
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
