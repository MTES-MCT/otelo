'use client'

import { usePathname } from 'next/navigation'
import { FC } from 'react'
import { getFlowFromPathname, getSlugFromPathname } from '../settings/wizard-steps'
import { CREATION_TUTORIAL_CONTENT } from './tutorial-content'
import { TutorialTrigger } from './tutorial-trigger'

/**
 * Déclenche le mode tuto de l'étape courante du parcours de création.
 *
 * Le tuto ne couvre pour l'instant que la création. La garde sur le parcours est
 * indispensable : le stepper est rendu aussi en modification, où les slugs sont les mêmes
 * mais les ancres vivent dans d'autres composants — le tuto s'y afficherait à côté.
 */
export const TutorialButton: FC = () => {
  const pathname = usePathname()
  const slug = getFlowFromPathname(pathname) === 'creation' ? getSlugFromPathname(pathname) : undefined

  return <TutorialTrigger steps={slug ? CREATION_TUTORIAL_CONTENT[slug] : undefined} label="Besoin d'aide sur cette étape" />
}
