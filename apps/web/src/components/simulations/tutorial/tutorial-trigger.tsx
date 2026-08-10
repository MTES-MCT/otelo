'use client'

import Button from '@codegouvfr/react-dsfr/Button'
import { FC, useRef } from 'react'
import type { TutorialStep } from './tutorial-content'
import { useTutorial } from './use-tutorial'

type TutorialTriggerProps = {
  /** Étapes de l'écran courant, ou `undefined` si l'écran n'est pas couvert par le tuto. */
  steps: TutorialStep[] | undefined
  label: string
}

/**
 * Bouton d'ouverture du mode tuto, commun à tous les écrans couverts.
 *
 * Ne rend rien si aucune étape n'est fournie : un bouton d'aide qui n'ouvre rien vaut moins
 * que pas de bouton du tout.
 */
export const TutorialTrigger: FC<TutorialTriggerProps> = ({ steps, label }) => {
  const triggerRef = useRef<HTMLButtonElement>(null)
  const { hasTutorial, start } = useTutorial(steps, triggerRef)

  if (!hasTutorial) {
    return null
  }

  return (
    <Button
      priority="tertiary no outline"
      size="small"
      iconId="fr-icon-question-line"
      iconPosition="left"
      onClick={start}
      type="button"
      nativeButtonProps={{ ref: triggerRef }}
    >
      {label}
    </Button>
  )
}
