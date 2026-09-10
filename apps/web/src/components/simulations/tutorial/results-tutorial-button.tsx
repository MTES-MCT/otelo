'use client'

import { parseAsString, useQueryState } from 'nuqs'
import { FC, useMemo } from 'react'
import { getResultsTutorialSteps } from './tutorial-content'
import { TutorialTrigger } from './tutorial-trigger'

type ResultsTutorialButtonProps = {
  /** Année du pic de ménages par EPCI, pour citer celle de l'onglet ouvert. */
  peakYears: Record<string, number>
}

/**
 * Déclenche le mode tuto de la page de résultats.
 *
 * Le parcours joué s'adapte à l'onglet ouvert : les ancres absentes du DOM sont filtrées au
 * démarrage, si bien que la synthèse et les onglets EPCI n'affichent que leurs propres
 * bulles à partir d'un registre unique. L'onglet actif vit dans `epci`, ce qui permet aussi
 * de citer le bon pic de ménages — l'onglet de synthèse, lui, n'en affiche aucun.
 */
export const ResultsTutorialButton: FC<ResultsTutorialButtonProps> = ({ peakYears }) => {
  const [epci] = useQueryState('epci', parseAsString)
  const peakYear = epci ? peakYears[epci] : undefined
  // `useTutorial` referme le tuto quand l'identité des étapes change : on ne la fait bouger
  // qu'au changement d'onglet, pas à chaque rendu de la page.
  const steps = useMemo(() => getResultsTutorialSteps({ peakYear }), [peakYear])

  return <TutorialTrigger label="Comprendre ces résultats" steps={steps} trackingName="resultats" />
}
