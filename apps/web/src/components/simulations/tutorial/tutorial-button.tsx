'use client'

import { usePathname } from 'next/navigation'
import { parseAsInteger, parseAsString, useQueryState, useQueryStates } from 'nuqs'
import { FC, useCallback, useMemo } from 'react'
import { getFlowFromPathname, getSlugFromPathname, type WizardStepSlug } from '../settings/wizard-steps'
import { getCreationTutorialSteps } from './tutorial-content'
import { TutorialTrigger } from './tutorial-trigger'

/**
 * Étapes où l'utilisateur arbitre entre des hypothèses : l'aide y prend la forme « Comment faire
 * mon choix ? », posée dans le fil de l'étape au plus près de la décision. Ailleurs, le guide de
 * prise en main reste en tête de carte.
 */
const CHOICE_HELP_SLUGS: readonly WizardStepSlug[] = [
  'parametrages-demographique',
  'taux-cibles-logements-vacants',
  'taux-cibles-residences-secondaires',
  'taux-restructuration-disparition',
]

type TutorialPlacement = 'header' | 'inline'

type StepTutorialButtonProps = {
  slug: WizardStepSlug
  autoStart: boolean
  onAutoStartSettled: () => void
  placement: TutorialPlacement
}

const StepTutorialButton: FC<StepTutorialButtonProps> = ({ slug, autoStart, onAutoStartSettled, placement }) => {
  // Millésime et horizon vivent dans l'URL : les lire ne coûte rien, sur n'importe quelle étape.
  const [{ millesime, projection }] = useQueryStates({ millesime: parseAsInteger, projection: parseAsInteger })
  // `useTutorial` referme le tuto dès que l'identité des étapes change : sans mémoïsation, un
  // simple re-rendu suffirait à faire disparaître le popover ouvert.
  const steps = useMemo(() => getCreationTutorialSteps(slug, { millesime, projection }), [slug, millesime, projection])

  return (
    <TutorialTrigger
      label={placement === 'inline' ? 'Comment faire mon choix ?' : 'Guide de prise en main'}
      variant={placement === 'inline' ? 'choice' : 'default'}
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
export const TutorialButton: FC<{ placement?: TutorialPlacement }> = ({ placement = 'header' }) => {
  const pathname = usePathname()
  const [tuto, setTuto] = useQueryState('tuto', parseAsString)
  const clearTuto = useCallback(() => {
    void setTuto(null)
  }, [setTuto])
  const slug = getFlowFromPathname(pathname) === 'creation' ? getSlugFromPathname(pathname) : undefined

  if (!slug || CHOICE_HELP_SLUGS.includes(slug) !== (placement === 'inline')) {
    return null
  }

  return <StepTutorialButton slug={slug} autoStart={tuto === '1'} onAutoStartSettled={clearTuto} placement={placement} />
}

/** « Comment faire mon choix ? », à poser dans le contenu des étapes de choix d'hypothèses. */
export const ChoiceHelpButton: FC = () => <TutorialButton placement="inline" />
