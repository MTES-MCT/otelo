'use client'

import { FC } from 'react'
import { RESULTS_TUTORIAL_CONTENT } from './tutorial-content'
import { TutorialTrigger } from './tutorial-trigger'

/**
 * Déclenche le mode tuto de la page de résultats.
 *
 * Le parcours joué s'adapte à l'onglet ouvert : les ancres absentes du DOM sont filtrées au
 * démarrage, si bien que la synthèse et les onglets EPCI n'affichent que leurs propres
 * bulles à partir d'un registre unique.
 */
export const ResultsTutorialButton: FC = () => <TutorialTrigger steps={RESULTS_TUTORIAL_CONTENT} label="Comprendre ces résultats" />
