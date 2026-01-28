'use client'

import { fr } from '@codegouvfr/react-dsfr'
import Checkbox from '@codegouvfr/react-dsfr/Checkbox'
import Input from '@codegouvfr/react-dsfr/Input'
import { useBadHousingSettings } from '~/app/(authenticated)/simulation/[id]/modifier/mal-logement/simulation-scenario-bad-housing-modification-provider'
import { UpdateBadHousingSimulationForm } from '~/components/simulations/settings/modification/mal-logement/update-bad-housing-simulation-form'
import styles from './validation-parametrage.module.css'

export default function ValidationParametragePage() {
  const { badHousingSettings } = useBadHousingSettings()
  return (
    <div className={styles.container}>
      <h3>Récapitulatif des paramètres</h3>
      <div className={styles.subContainer}>
        <div className={styles.sectionContainer}>
          <h5>Horizon de résorption</h5>
          <div className={styles.horizonSubContainer}>
            <Input
              disabled
              label=""
              hintText="Horizon de résorption"
              nativeInputProps={{ value: `${badHousingSettings.horizon}` }}
              className={styles.inputFlex}
            />
          </div>
        </div>
        <div className={styles.sectionContainer}>
          <h5>Paramétrage hors logement</h5>
          <div className={styles.subContainer}>
            <Input
              disabled
              label=""
              hintText="Source"
              nativeInputProps={{ value: badHousingSettings.horsLogement.source }}
              className={styles.inputFlex}
            />
            <Input
              disabled
              label=""
              hintText="Part"
              nativeInputProps={{ value: `${badHousingSettings.horsLogement.part}%` }}
              className={styles.inputFlex}
            />
          </div>
        </div>
      </div>
      <div className={styles.subContainer}>
        <div className={fr.cx('fr-p-2w')} style={{ backgroundColor: fr.colors.decisions.background.default.grey.default }}>
          <div className={styles.hebergesContainer}>
            <h5>Paramétrage hébergés</h5>
            <div className={styles.hebergesSubContainer}>
              <Input disabled label="" hintText="Source" nativeInputProps={{ value: badHousingSettings.horsLogement.source }} />
              <Input disabled label="" hintText="Part" nativeInputProps={{ value: `${badHousingSettings.horsLogement.part}%` }} />
              <Checkbox
                disabled
                legend="Type d'hébergement"
                options={[
                  {
                    label: 'Logés chez un particulier',
                    nativeInputProps: {
                      checked: badHousingSettings.heberges.particular,
                      name: 'particular',
                      readOnly: true,
                    },
                  },
                  {
                    label: 'Logés temporairement',
                    nativeInputProps: {
                      checked: badHousingSettings.heberges.temporary,
                      name: 'temporary',
                      readOnly: true,
                    },
                  },
                ]}
              />
            </div>
          </div>
        </div>
        <div className={fr.cx('fr-p-2w')} style={{ backgroundColor: fr.colors.decisions.background.default.grey.default }}>
          <h5>Paramétrage inadéquation financière</h5>
          <div className={styles.inadequationContainer}>
            <div className={styles.inadequationInputs}>
              <Input
                disabled
                label=""
                hintText="Source"
                nativeInputProps={{ value: badHousingSettings.inadequationFinanciere.maxEffort }}
              />
              <Input disabled label="" hintText="Part" nativeInputProps={{ value: `${badHousingSettings.inadequationFinanciere.part}%` }} />
            </div>
            <div>
              <Checkbox
                disabled
                options={[
                  { label: 'Accédant', nativeInputProps: { checked: badHousingSettings.inadequationFinanciere.accedant, readOnly: true } },
                  {
                    label: 'Locataire du parc privé',
                    nativeInputProps: { checked: badHousingSettings.inadequationFinanciere.plp, readOnly: true },
                  },
                ]}
                orientation="horizontal"
              />
            </div>
          </div>
        </div>
      </div>
      <div className={styles.qualityContainer}>
        <div className={styles.qualityCard} style={{ backgroundColor: fr.colors.decisions.background.default.grey.default }}>
          <h5>Paramétrage mauvaise qualité</h5>
          <div className={styles.qualityInputs}>
            <div className={styles.qualityInputGroup}>
              <Input
                disabled
                label=""
                hintText="Source"
                nativeInputProps={{ value: badHousingSettings.badQuality.source }}
                className={styles.inputFlex}
              />
              <Input
                disabled
                label=""
                hintText="Part"
                nativeInputProps={{ value: `${badHousingSettings.badQuality.part}%` }}
                className={styles.inputFlex}
              />
            </div>
          </div>
        </div>
        <div className={styles.qualityCard} style={{ backgroundColor: fr.colors.decisions.background.default.grey.default }}>
          <h5>Paramétrage suroccupation</h5>
          <div className={styles.qualityInputs}>
            <div className={styles.qualityInputGroup}>
              <Input
                disabled
                label=""
                hintText="Source"
                nativeInputProps={{ value: badHousingSettings.suroccupation.source }}
                className={styles.inputFlex}
              />
              <Input
                disabled
                label=""
                hintText="Part"
                nativeInputProps={{ value: `${badHousingSettings.suroccupation.part}%` }}
                className={styles.inputFlex}
              />
            </div>
          </div>
        </div>
      </div>
      <UpdateBadHousingSimulationForm />
    </div>
  )
}
