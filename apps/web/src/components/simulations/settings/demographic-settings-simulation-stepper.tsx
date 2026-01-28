'use client'

import { fr } from '@codegouvfr/react-dsfr'
import Stepper from '@codegouvfr/react-dsfr/Stepper'
import classNames from 'classnames'
import { usePathname } from 'next/navigation'
import { FC, useMemo } from 'react'

const modifierStepCount = 5
const creationStepCount = 6
const STEPPER_CONFIG = {
  modifier: {
    'cadrage-temporel': {
      currentStep: 1,
      description: "Les futurs paramétrages seront appliqués à l'horizon temporel choisi",
      stepCount: modifierStepCount,
      title: "Déterminer l'horizon de temps",
    },
    'parametrages-demographique': {
      currentStep: 2,
      description: "Les choix de projection démographique s'appliquent à l'ensemble des EPCI inclus dans le territoire d'étude.",
      stepCount: modifierStepCount,
      title: 'Affiner la projection démographique',
    },
    'taux-cibles-logements-vacants': {
      currentStep: 3,
      stepCount: modifierStepCount,
      title: 'Cibler le taux de logements vacants de longue durée',
    },
    'taux-cibles-residences-secondaires': {
      currentStep: 5,
      stepCount: creationStepCount,
      title: 'Cibler le taux de résidences secondaires',
    },
    'taux-restructuration-disparition': {
      currentStep: 4,
      stepCount: modifierStepCount,
      title: 'Paramétrer les dynamiques de renouvellement urbain',
    },
  },
  creation: {
    'choix-du-territoire': {
      currentStep: 1,
      stepCount: creationStepCount,
      title: 'Choix du territoire',
    },
    'cadrage-temporel': {
      currentStep: 2,
      description: "Les futurs paramétrages seront appliqués à l'horizon temporel choisi",
      stepCount: creationStepCount,
      title: "Déterminer l'horizon de temps",
    },
    'parametrages-demographique': {
      currentStep: 3,
      description: "Les choix de projection démographique s'appliquent à l'ensemble des EPCI inclus dans le territoire d'étude.",
      stepCount: creationStepCount,
      title: 'Affiner la projection démographique',
    },
    'taux-cibles-logements-vacants': {
      currentStep: 4,
      stepCount: creationStepCount,
      title: 'Cibler le taux de logements vacants de longue durée',
    },
    'taux-cibles-residences-secondaires': {
      currentStep: 5,
      stepCount: creationStepCount,
      title: 'Cibler le taux de résidences secondaires',
    },
    'taux-restructuration-disparition': {
      currentStep: 6,
      stepCount: creationStepCount,
      title: 'Paramétrer les dynamiques de renouvellement urbain',
    },
  },
}

const DEFAULT_CONFIG = {
  modifier: {
    currentStep: 1,
    stepCount: 4,
    description: null,
    title: "Déterminer l'horizon de temps",
  },
  creation: {
    currentStep: 1,
    stepCount: 4,
    description: null,
    title: 'Choix du territoire',
  },
}

export const DemographicSettingsSimulationStepper: FC = () => {
  const pathname = usePathname()
  const isModifierPath = pathname.includes('modifier')
  const isRatesPath = pathname.includes('taux')

  const config = useMemo(() => {
    const dynamicPathname = pathname.split('/').pop()
    const configKey = isModifierPath ? 'modifier' : 'creation'

    return STEPPER_CONFIG[configKey][dynamicPathname as keyof (typeof STEPPER_CONFIG)[typeof configKey]] || DEFAULT_CONFIG[configKey]
  }, [pathname, isModifierPath])

  return (
    <div
      className={classNames('fr-px-2w fr-py-0-5v fr-px-md-4w fr-pt-md-4w shadow', !isRatesPath && 'fr-pb-5w')}
      style={{ background: fr.colors.decisions.background.default.grey.default }}
    >
      <Stepper {...config} />
      {'description' in config && config.description && (
        <div className="fr-text--sm fr-text-mention--grey fr-mb-0">{config.description}</div>
      )}
    </div>
  )
}
