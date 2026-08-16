'use client'

import { type Driver, driver } from 'driver.js'
import 'driver.js/dist/driver.css'
import { type RefObject, useCallback, useEffect, useRef } from 'react'
import { trackEvent } from '~/lib/tracking'
import { type TutorialStep, tutorialStepSelector } from './tutorial-content'
import './tutorial.css'

/**
 * `getClientRects()` ne suffit pas : le DSFR laisse les onglets non sélectionnés en
 * `display: block` à `left: -100%` et ne les masque qu'en `visibility: hidden`. Ils ont
 * donc des rectangles non nuls. Seule la visibilité calculée les écarte.
 */
const isVisible = (element: HTMLElement): boolean => {
  if (typeof element.checkVisibility === 'function') {
    return element.checkVisibility({ opacityProperty: true, visibilityProperty: true })
  }
  return element.getClientRects().length > 0 && window.getComputedStyle(element).visibility !== 'hidden'
}

/**
 * Première occurrence visible de la cible d'une étape.
 *
 * Les blocs de taux sont répétés par EPCI dans des onglets : une ancre existe en autant
 * d'exemplaires que d'EPCI, dont un seul est réellement affiché.
 */
const resolveTarget = (step: TutorialStep): HTMLElement | null =>
  Array.from(document.querySelectorAll<HTMLElement>(tutorialStepSelector(step))).find(isVisible) ?? null

/**
 * Pilote le mode tuto de l'écran courant.
 *
 * Le hook ne connaît pas les écrans : il reçoit les étapes à jouer. Chaque appelant va les
 * chercher dans le registre qui le concerne (parcours de création indexé par slug, page de
 * résultats, etc.).
 *
 * driver.js manipule le DOM hors de React : l'instance est détruite au démontage et à
 * chaque changement d'étape, faute de quoi un popover survivrait à la navigation.
 *
 * On lui délègue tout ce qu'il sait déjà faire — `role="dialog"`, `aria-labelledby`,
 * piège de tabulation, focus initial. Ajouter les nôtres par-dessus les ferait entrer en
 * conflit avec les siens.
 */
export const useTutorial = (
  steps: TutorialStep[] | undefined,
  triggerRef: RefObject<HTMLButtonElement | null>,
  /**
   * Identifiant de l'écran, pour le suivi d'usage. Le tuto est entièrement opt-in et
   * sans état persisté : sans ces événements, rien ne permet de savoir s'il est ouvert,
   * ni jusqu'où les utilisateurs vont dedans.
   */
  trackingName?: string,
) => {
  const driverRef = useRef<Driver | null>(null)
  const observerRef = useRef<ResizeObserver | null>(null)
  // Distingue une fermeture par l'utilisateur d'une destruction au démontage : sans ce
  // drapeau, quitter l'étape tuto ouvert ramènerait le focus sur le bouton d'aide, qui
  // survit dans le layout.
  const isTearingDownRef = useRef(false)

  const teardown = useCallback(() => {
    isTearingDownRef.current = true
    observerRef.current?.disconnect()
    observerRef.current = null
    driverRef.current?.destroy()
    driverRef.current = null
    isTearingDownRef.current = false
  }, [])

  // Chaque étape est une route : on ferme le tuto de l'étape quittée. Les registres sont
  // des constantes de module, l'identité des étapes ne change donc qu'avec l'écran.
  useEffect(() => teardown, [steps, teardown])

  const start = useCallback(() => {
    if (!steps?.length) {
      return
    }

    // driver.js calcule « x sur y » sur la longueur totale des étapes fournies, et
    // n'ignore pas une ancre absente : il affiche un popover orphelin centré. On résout
    // donc en amont pour que la progression annoncée corresponde aux bulles montrées.
    const reachable = steps
      .map((step) => ({ step, initial: resolveTarget(step) }))
      .filter((entry): entry is typeof entry & { initial: HTMLElement } => Boolean(entry.initial))

    if (!reachable.length) {
      return
    }

    teardown()

    const instance = driver({
      allowClose: true,
      allowKeyboardControl: true,
      // RGAA 13.8 : pas d'animation imposée à qui n'en veut pas.
      animate: !window.matchMedia('(prefers-reduced-motion: reduce)').matches,
      // Le tuto explique, il ne fait pas agir. Sans cela driver laisse la cible
      // interactive, et un re-render nuqs remplacerait le nœud sous le popover.
      disableActiveInteraction: true,
      doneBtnText: 'Terminer',
      nextBtnText: 'Suivant',
      overlayOpacity: 0.6,
      popoverClass: 'otelo-tutorial-popover',
      prevBtnText: 'Précédent',
      progressText: 'Aide {{current}} sur {{total}}',
      showProgress: true,
      // Filet : si le DOM bouge après le filtrage, on saute plutôt que d'afficher un
      // popover orphelin au centre de l'écran.
      skipMissingElement: true,
      stagePadding: 6,
      // Le DSFR n'arrondit pas ses surfaces.
      stageRadius: 0,
      steps: reachable.map(({ step, initial }) => ({
        // Résolu à chaque bulle plutôt qu'une fois pour toutes : `refresh()` ne
        // re-résout pas la cible et se recalerait sur un nœud détaché.
        element: () => resolveTarget(step) ?? initial,
        popover: { align: step.align, description: step.description, side: step.side, title: step.title },
      })),
      onPopoverRender: (popover) => {
        popover.closeButton.setAttribute('aria-label', "Fermer l'aide")
      },
      onDestroyed: () => {
        if (isTearingDownRef.current) {
          return
        }

        if (trackingName) {
          const activeIndex = instance.getActiveIndex() ?? 0

          trackEvent({
            action: 'fin tutoriel',
            category: 'Aide',
            name: activeIndex >= reachable.length - 1 ? 'termine' : 'abandonne',
            value: activeIndex + 1,
          })
        }

        triggerRef.current?.focus()
      },
    })

    driverRef.current = instance

    if (trackingName) {
      trackEvent({ action: 'ouverture tutoriel', category: 'Aide', name: trackingName, value: reachable.length })
    }

    // Le contenu bouge sous le projecteur : alertes « pic de ménages », graphiques montés
    // après coup, requêtes react-query qui se résolvent. `refresh()` est throttlé en
    // interne et ne touche pas au focus, contrairement à `moveTo()`.
    observerRef.current = new ResizeObserver(() => driverRef.current?.refresh())
    observerRef.current.observe(document.body)

    instance.drive()
  }, [steps, teardown, triggerRef, trackingName])

  return { hasTutorial: Boolean(steps?.length), start }
}
