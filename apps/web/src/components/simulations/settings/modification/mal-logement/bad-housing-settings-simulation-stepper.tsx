'use client'

import { fr } from '@codegouvfr/react-dsfr'
import Stepper from '@codegouvfr/react-dsfr/Stepper'
import { usePathname } from 'next/navigation'
import { FC, useMemo } from 'react'

export const BadHousingSettingsSimulationStepper: FC = () => {
  const pathname = usePathname()
  const stepperProps = useMemo(() => {
    const dynamicPathname = pathname.split('/').pop()
    switch (dynamicPathname) {
      case 'horizon-de-resorption':
        return {
          currentStep: 1,
          nextTitle: 'Paramétrage hors logement',
          stepCount: 7,
          title: "Déterminer l'horizon de résorption",
        }
      case 'hors-logement':
        return {
          currentStep: 2,
          nextTitle: 'Paramétrage hébergés',
          stepCount: 7,
          title: 'Paramétrage hors logement',
        }
      case 'heberges':
        return {
          currentStep: 3,
          nextTitle: 'Paramétrage inadéquation financière',
          stepCount: 7,
          title: 'Paramétrage hébergés',
        }
      case 'inadequation-financiere':
        return {
          currentStep: 4,
          nextTitle: 'Paramétrage mauvaise qualité',
          stepCount: 7,
          title: 'Paramétrage inadéquation financière',
        }
      case 'mauvaise-qualite':
        return {
          currentStep: 5,
          nextTitle: 'Paramétrage suroccupation',
          stepCount: 7,
          title: 'Paramétrage mauvaise qualité',
        }
      case 'suroccupation':
        return {
          currentStep: 6,
          nextTitle: 'Validation de votre paramétrage',
          stepCount: 7,
          title: 'Paramétrage suroccupation',
        }
      case 'validation-parametrage':
        return {
          currentStep: 7,
          stepCount: 7,
          title: 'Validation de votre paramétrage',
        }
      default:
        return {
          currentStep: 1,
          nextTitle: 'Paramétrage hors logement',
          stepCount: 7,
          title: "Déterminer l'horizon de résorption",
        }
    }
  }, [pathname])

  return (
    <div
      className={fr.cx('fr-my-2w', 'fr-px-2w', 'fr-py-0-5v', 'fr-p-md-4w')}
      style={{ background: fr.colors.decisions.background.default.grey.default }}
    >
      <Stepper {...stepperProps} />
    </div>
  )
}
