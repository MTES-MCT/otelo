'use client'

import { FC } from 'react'
import { BAD_HOUSING_TUTORIAL_CONTENT } from './tutorial-content'
import { TutorialTrigger } from './tutorial-trigger'

/**
 * Déclenche le mode tuto du sous-parcours « Affiner le mal-logement ».
 *
 * Registre unique pour les sept écrans, comme la page de résultats : ils partagent le menu
 * latéral et le curseur de part, et seul l'horizon de résorption est propre au premier. Les
 * ancres absentes de l'écran courant sont filtrées au démarrage.
 */
export const BadHousingTutorialButton: FC = () => (
  <TutorialTrigger label="Guide de prise en main" steps={BAD_HOUSING_TUTORIAL_CONTENT} trackingName="mal-logement" />
)
