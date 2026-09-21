'use client'

import { usePathname } from 'next/navigation'
import { parseAsArrayOf, parseAsInteger, parseAsString, useQueryState, useQueryStates } from 'nuqs'
import { FC, useCallback, useMemo } from 'react'
import { useCreationPeakYears } from '~/hooks/use-simulation-peak-years'
import { getFlowFromPathname, getSlugFromPathname, type WizardStepSlug } from '../settings/wizard-steps'
import { getCreationTutorialSteps, type TutorialContext } from './tutorial-content'
import { TutorialTrigger } from './tutorial-trigger'

/**
 * Étapes dont une bulle cite l'année du pic de ménages.
 *
 * Ailleurs, lire le pic coûterait une prévisualisation du scénario pour un seul texte : sur
 * ces deux étapes elle est déjà chargée par le paramétrage lui-même, la requête est donc
 * mutualisée. D'où deux composants plutôt qu'un `if` — un hook ne s'appelle pas sous condition.
 */
const PEAK_YEAR_STEPS = new Set<WizardStepSlug>(['taux-cibles-logements-vacants', 'taux-cibles-residences-secondaires'])

/** Millésime et horizon vivent dans l'URL : les lire ne coûte rien, sur n'importe quelle étape. */
const useScenarioContext = (): TutorialContext => {
  const [{ millesime, projection }] = useQueryStates({ millesime: parseAsInteger, projection: parseAsInteger })
  return { millesime, projection }
}

type StepTutorialButtonProps = {
  slug: WizardStepSlug
  context: TutorialContext
  autoStart: boolean
  onAutoStartSettled: () => void
}

const StepTutorialButton: FC<StepTutorialButtonProps> = ({ slug, context, autoStart, onAutoStartSettled }) => {
  const { millesime, peakYear, projection } = context
  // `useTutorial` referme le tuto dès que l'identité des étapes change : sans mémoïsation, un
  // simple re-rendu suffirait à faire disparaître le popover ouvert.
  const steps = useMemo(() => getCreationTutorialSteps(slug, { millesime, peakYear, projection }), [slug, millesime, peakYear, projection])

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

/** Variante des étapes de taux cibles : le pic de ménages est celui du territoire affiché. */
const PeakAwareTutorialButton: FC<StepTutorialButtonProps> = ({ slug, context, autoStart, onAutoStartSettled }) => {
  const [{ epciChart, epcis }] = useQueryStates({
    epciChart: parseAsString,
    epcis: parseAsArrayOf(parseAsString).withDefault([]),
  })
  const { peakYears, projection } = useCreationPeakYears()

  // L'onglet actif pilote l'ancre visible : la bulle doit citer le pic du même EPCI. À défaut
  // d'onglet dans l'URL, le DSFR affiche le premier de la liste.
  const displayedEpci = epciChart ?? epcis[0]
  const peakYear = displayedEpci ? peakYears[displayedEpci] : undefined
  // Un pic postérieur ou égal à l'horizon n'est pas un cas particulier : l'encart n'est pas
  // rendu, et la bulle est de toute façon filtrée au démarrage.
  const isPeakBeforeProjection = !!peakYear && !!projection && peakYear < projection

  return (
    <StepTutorialButton
      slug={slug}
      context={{ ...context, peakYear: isPeakBeforeProjection ? peakYear : null }}
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
  const context = useScenarioContext()
  const [tuto, setTuto] = useQueryState('tuto', parseAsString)
  const clearTuto = useCallback(() => {
    void setTuto(null)
  }, [setTuto])
  const slug = getFlowFromPathname(pathname) === 'creation' ? getSlugFromPathname(pathname) : undefined

  if (!slug) {
    return null
  }

  const Trigger = PEAK_YEAR_STEPS.has(slug) ? PeakAwareTutorialButton : StepTutorialButton

  return <Trigger slug={slug} context={context} autoStart={tuto === '1'} onAutoStartSettled={clearTuto} />
}
