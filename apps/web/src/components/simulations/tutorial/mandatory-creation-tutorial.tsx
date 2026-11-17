'use client'

import { usePathname } from 'next/navigation'
import { parseAsInteger, useQueryStates } from 'nuqs'
import { FC, useCallback, useEffect, useMemo, useRef } from 'react'
import { bubbleKey, hasSeenEveryCreationStep, isBubbleSeen, isWelcomeDone, markBubbleSeen } from '~/components/onboarding/tutorial-progress'
import { useTutorialRequirement } from '~/components/onboarding/use-tutorial-requirement'
import { CREATION_STEPS, getFlowFromPathname, getSlugFromPathname } from '../settings/wizard-steps'
import { getCreationTutorialSteps } from './tutorial-content'
import { useTutorial } from './use-tutorial'

/** Les ancres apparaissent au fil des choix de l'utilisateur : on guette les nouvelles bulles. */
const WATCH_INTERVAL_MS = 400

const FIRST_SLUG = CREATION_STEPS[0].slug
const LAST_SLUG = CREATION_STEPS[CREATION_STEPS.length - 1].slug

/** Un dialogue (DSFR ou driver.js) occupe déjà l'écran : le tuto attend qu'il se ferme. */
const isScreenBusy = (): boolean =>
  document.body.classList.contains('driver-active') || document.querySelector('.fr-modal--opened') !== null

/**
 * Didacticiel imposé au premier passage dans le parcours de création.
 *
 * Tant que le compte ne l'a pas terminé, chaque étape joue d'office ses bulles, sans possibilité
 * de les fermer avant « Terminer ». Les bulles dont l'ancre n'apparaît qu'après un choix — le
 * bassin une fois l'EPCI trouvé, l'onglet « ménages » de l'étape démographique — sont jouées dès
 * qu'elles deviennent visibles. Une bulle déjà lue ne revient pas.
 *
 * Monté une seule fois dans le layout : les boutons d'aide, eux, sont répétés par onglet d'EPCI
 * et lanceraient autant de tutos concurrents.
 *
 * La fin est enregistrée en base à « Terminer » sur la dernière étape, à condition que chacune
 * des étapes ait été déroulée.
 */
export const MandatoryCreationTutorial: FC = () => {
  const pathname = usePathname()
  const { isRequired, markCompleted, userId } = useTutorialRequirement()
  const [{ millesime, projection }] = useQueryStates({ millesime: parseAsInteger, projection: parseAsInteger })
  const slug = getFlowFromPathname(pathname) === 'creation' ? getSlugFromPathname(pathname) : undefined
  const steps = useMemo(() => (slug ? getCreationTutorialSteps(slug, { millesime, projection }) : undefined), [slug, millesime, projection])
  // Aucun bouton à refocaliser : le tuto n'est pas ouvert par un clic.
  const triggerRef = useRef<HTMLButtonElement>(null)
  const isCompletingRef = useRef(false)

  const onStepShown = useCallback(
    (index: number) => {
      if (userId && slug) markBubbleSeen(userId, bubbleKey(slug, index))
    },
    [userId, slug],
  )

  const onDone = useCallback(() => {
    if (userId && slug === LAST_SLUG && hasSeenEveryCreationStep(userId)) {
      void markCompleted()
    }
  }, [userId, slug, markCompleted])

  const { start } = useTutorial(steps, triggerRef, slug ? `${slug} (obligatoire)` : undefined, { onDone, onStepShown })

  useEffect(() => {
    if (!isRequired || !userId || !slug || !steps?.length) {
      return
    }

    const tick = () => {
      // Sur la première étape, la présentation d'Otelo passe avant les bulles.
      if (isScreenBusy() || (slug === FIRST_SLUG && !isWelcomeDone(userId))) {
        return
      }
      const hasStarted = start({ isSeen: (index) => isBubbleSeen(userId, bubbleKey(slug, index)), mandatory: true })

      // Rattrapage : tout a été lu mais l'enregistrement de la fin a échoué, ou la page a été
      // rechargée juste après « Terminer ».
      if (!hasStarted && slug === LAST_SLUG && hasSeenEveryCreationStep(userId) && !isCompletingRef.current) {
        // Une seule tentative par passage sur l'étape : un échec ne doit pas bombarder l'API.
        isCompletingRef.current = true
        void markCompleted()
      }
    }

    tick()
    const timer = setInterval(tick, WATCH_INTERVAL_MS)
    return () => clearInterval(timer)
  }, [isRequired, userId, slug, steps, start, markCompleted])

  return null
}
