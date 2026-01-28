'use client'

import { fr } from '@codegouvfr/react-dsfr'
import React from 'react'
import { useBadHousingSettings } from '~/app/(authenticated)/simulation/[id]/modifier/mal-logement/simulation-scenario-bad-housing-modification-provider'
import { BadHousingSettingsCreationGuideTag } from '~/components/simulations/creation-guide/bad-housing-settings-creation-guide-tag'
import styles from '../../simulation-side-menu.module.css'

type BadHousingSettingsSimulationSideMenuProps = {
  id: string
}

export default function BadHousingSettingsSimulationSideMenu({ id }: BadHousingSettingsSimulationSideMenuProps) {
  const { badHousingSettings } = useBadHousingSettings()
  const badHousingSteps = [
    {
      label: 'Horizon de résorption',
      path: `/simulation/${id}/modifier/mal-logement/horizon-de-resorption`,
      title: <span>Déterminer l&apos;horizon de résorption</span>,
      value: `${badHousingSettings.horizon}`,
    },
    {
      label: 'Hors logement',
      path: `/simulation/${id}/modifier/mal-logement/hors-logement`,
      title: <span>Paramétrage hors logement</span>,
      value: `Source: ${badHousingSettings.horsLogement.source} - Part: ${badHousingSettings.horsLogement.part}%`,
    },
    {
      label: 'Hébergés',
      path: `/simulation/${id}/modifier/mal-logement/heberges`,
      title: <span>Paramétrage hébergés</span>,
      value: `Part: ${badHousingSettings.heberges.part}% | ${badHousingSettings.heberges.particular ? 'Particulier -' : ''} ${badHousingSettings.heberges.temporary ? 'Temporaire' : ''}`,
    },
    {
      label: 'Inadéquation financière',
      path: `/simulation/${id}/modifier/mal-logement/inadequation-financiere`,
      title: <span>Paramétrage inadéquation financière</span>,
      value: `Part: ${badHousingSettings.inadequationFinanciere.part}% | ${badHousingSettings.inadequationFinanciere.accedant ? 'Accédant -' : ''} ${badHousingSettings.inadequationFinanciere.plp ? 'Locataire du parc privé' : ''}`,
    },
    {
      label: 'Mauvaise qualité',
      path: `/simulation/${id}/modifier/mal-logement/mauvaise-qualite`,
      title: <span>Paramétrage mauvaise qualité</span>,
      value: `Source: ${badHousingSettings.badQuality.source} | Part: ${badHousingSettings.badQuality.part}%`,
    },
    {
      label: 'Suroccupation',
      path: `/simulation/${id}/modifier/mal-logement/suroccupation`,
      title: <span>Paramétrage suroccupation</span>,
      value: `Source: ${badHousingSettings.suroccupation.source} | Part: ${badHousingSettings.suroccupation.part}%`,
    },
  ]
  return (
    <nav className={fr.cx('fr-col-md-3')}>
      <div className={styles.container}>
        {badHousingSteps.map((step, index) => (
          <React.Fragment key={index}>
            <div className={styles.stepContainer}>
              <div className={styles.stepNumber}>
                <span className={styles.stepNumberText}>{index + 1}</span>
              </div>
              <span>{step.title}</span>
            </div>
            {
              <div className={styles.stepDelimitor}>
                <div className={styles.badgeContainer}>
                  <BadHousingSettingsCreationGuideTag step={step} />
                </div>
              </div>
            }
          </React.Fragment>
        ))}
        <div className={styles.stepContainer}>
          <div className={styles.stepNumber}>{badHousingSteps.length + 1}</div>
          <span>Validation de votre paramétrage</span>
        </div>
      </div>
    </nav>
  )
}
