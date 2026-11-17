'use client'

import { usePathname } from 'next/navigation'
import { FC } from 'react'
import { useBadHousingSettings } from '~/app/(authenticated)/simulation/[id]/modifier/mal-logement/simulation-scenario-bad-housing-modification-provider'
import { ScenarioPanel } from '../../scenario-panel/scenario-panel'
import styles from '../../scenario-panel/scenario-panel.module.css'
import { BAD_HOUSING_STEPS, getBadHousingStepIndex } from './bad-housing-steps'

const joinDefined = (values: Array<string | false>) => values.filter(Boolean).join(' · ')

/** Récapitulatif du paramétrage du mal-logement : une ligne par étape atteinte. */
export const BadHousingScenarioPanel: FC = () => {
  const { badHousingSettings } = useBadHousingSettings()
  const currentIndex = getBadHousingStepIndex(usePathname())
  const { badQuality, heberges, horizon, horsLogement, inadequationFinanciere, suroccupation } = badHousingSettings

  const recap = [
    { label: 'Horizon de résorption', value: `${horizon}` },
    { label: 'Hors logement', value: joinDefined([`Part : ${horsLogement.part} %`, `Source : ${horsLogement.source}`]) },
    {
      label: 'Hébergés',
      value: joinDefined([`Part : ${heberges.part} %`, heberges.particular && 'Particulier', heberges.temporary && 'Temporaire']),
    },
    {
      label: 'Inadéquation financière',
      value: joinDefined([
        `Part : ${inadequationFinanciere.part} %`,
        inadequationFinanciere.accedant && 'Accédant',
        inadequationFinanciere.plp && 'Locataire du parc privé',
      ]),
    },
    { label: 'Mauvaise qualité', value: joinDefined([`Part : ${badQuality.part} %`, `Source : ${badQuality.source}`]) },
    { label: 'Suroccupation', value: joinDefined([`Part : ${suroccupation.part} %`, `Source : ${suroccupation.source}`]) },
  ]

  // Les lignes suivent l'ordre du registre, sans l'étape de validation qui n'a rien à récapituler.
  const revealedRecap = recap.filter((_, index) => index <= currentIndex && index < BAD_HOUSING_STEPS.length - 1)

  return (
    <ScenarioPanel anchor="bad-housing-scenario-panel">
      <ul className={styles.recap}>
        {revealedRecap.map((item) => (
          <li key={item.label} className={styles.row}>
            <span className={styles.rowLabel}>
              {item.label}
              <span className={styles.rowDetail}>{item.value}</span>
            </span>
          </li>
        ))}
      </ul>
    </ScenarioPanel>
  )
}
