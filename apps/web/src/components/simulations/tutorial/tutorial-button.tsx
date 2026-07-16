'use client'

import Button from '@codegouvfr/react-dsfr/Button'
import { usePathname } from 'next/navigation'
import { FC, useRef } from 'react'
import { getFlowFromPathname, getSlugFromPathname } from '../settings/wizard-steps'
import { useTutorial } from './use-tutorial'

/**
 * Déclenche le mode tuto de l'étape courante.
 *
 * Le tuto ne couvre pour l'instant que la création. La garde sur le parcours est
 * indispensable : le stepper est rendu aussi en modification, où les slugs sont les mêmes
 * mais les ancres vivent dans d'autres composants — le tuto s'y afficherait à côté.
 */
export const TutorialButton: FC = () => {
  const pathname = usePathname()
  const triggerRef = useRef<HTMLButtonElement>(null)
  const isCreation = getFlowFromPathname(pathname) === 'creation'
  const { hasTutorial, start } = useTutorial(isCreation ? getSlugFromPathname(pathname) : undefined, triggerRef)

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
      Besoin d'aide sur cette étape
    </Button>
  )
}
