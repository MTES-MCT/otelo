'use client'

import { usePathname } from 'next/navigation'
import { parseAsInteger, parseAsString, useQueryState, useQueryStates } from 'nuqs'
import { FC, useCallback, useMemo } from 'react'
import { getFlowFromPathname, getSlugFromPathname, type WizardStepSlug } from '../settings/wizard-steps'
import { getCreationTutorialSteps } from './tutorial-content'
import { TutorialTrigger } from './tutorial-trigger'

type StepTutorialButtonProps = {
  slug: WizardStepSlug
  autoStart: boolean
  onAutoStartSettled: () => void
}

const StepTutorialButton: FC<StepTutorialButtonProps> = ({ slug, autoStart, onAutoStartSettled }) => {
  // Millésime et horizon vivent dans l'URL : les lire ne coûte rien, sur n'importe quelle étape.
  const [{ millesime, projection }] = useQueryStates({ millesime: parseAsInteger, projection: parseAsInteger })
  // `useTutorial` referme le tuto dès que l'identité des étapes change : sans mémoïsation, un
  // simple re-rendu suffirait à faire disparaître le popover ouvert.
  const steps = useMemo(() => getCreationTutorialSteps(slug, { millesime, projection }), [slug, millesime, projection])

  return (
    <TutorialTrigger
      label="Guide de prise en main"
      steps={steps}
      trackingName={slug}
      autoStart={autoStart}
      onAutoStartSettled={onAutoStartSettled}
    />
  )
}

/**
 * Déclenche le mode tuto de l'étape courante du parcours de création.
 *
 * Le tuto ne couvre pour l'instant que la création. La garde sur le parcours est
 * indispensable : le stepper est rendu aussi en modification, où les slugs sont les mêmes
 * mais les ancres vivent dans d'autres composants — le tuto s'y afficherait à côté.
 *
 * `?tuto=1` ouvre le tuto sans clic : c'est par là que le mot de bienvenue fait entrer un
 * nouvel arrivant dans le parcours. Le paramètre est retiré une fois joué, faute de quoi un
 * rechargement — ou une URL partagée — rouvrirait le tuto à chaque fois.
 */
export const TutorialButton: FC = () => {
  const pathname = usePathname()
  const [tuto, setTuto] = useQueryState('tuto', parseAsString)
  const clearTuto = useCallback(() => {
    void setTuto(null)
  }, [setTuto])
  const slug = getFlowFromPathname(pathname) === 'creation' ? getSlugFromPathname(pathname) : undefined

  if (!slug) {
    return null
  }

  return <StepTutorialButton slug={slug} autoStart={tuto === '1'} onAutoStartSettled={clearTuto} />
}
