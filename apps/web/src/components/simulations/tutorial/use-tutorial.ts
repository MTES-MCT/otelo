'use client'

import { type Driver, driver } from 'driver.js'
import 'driver.js/dist/driver.css'
import { type RefObject, useCallback, useEffect, useRef } from 'react'
import type { WizardStepSlug } from '../settings/wizard-steps'
import { CREATION_TUTORIAL_CONTENT, type TutorialAnchor, tutorialSelector } from './tutorial-content'
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
 * Première occurrence visible d'une ancre.
 *
 * Les blocs de taux sont répétés par EPCI dans des onglets : une ancre existe en autant
 * d'exemplaires que d'EPCI, dont un seul est réellement affiché.
 */
const resolveAnchor = (anchor: TutorialAnchor): HTMLElement | null =>
  Array.from(document.querySelectorAll<HTMLElement>(tutorialSelector(anchor))).find(isVisible) ?? null

/**
 * Pilote le mode tuto de l'étape courante.
 *
 * driver.js manipule le DOM hors de React : l'instance est détruite au démontage et à
 * chaque changement d'étape, faute de quoi un popover survivrait à la navigation.
 *
 * On lui délègue tout ce qu'il sait déjà faire — `role="dialog"`, `aria-labelledby`,
 * piège de tabulation, focus initial. Ajouter les nôtres par-dessus les ferait entrer en
 * conflit avec les siens.
 */
export const useTutorial = (slug: WizardStepSlug | undefined, triggerRef: RefObject<HTMLButtonElement | null>) => {
  const driverRef = useRef<Driver | null>(null)
  const observerRef = useRef<ResizeObserver | null>(null)
  // Distingue une fermeture par l'utilisateur d'une destruction au démontage : sans ce
  // drapeau, quitter l'étape tuto ouvert ramènerait le focus sur le bouton d'aide, qui
  // survit dans le layout.
  const isTearingDownRef = useRef(false)

  const steps = slug ? CREATION_TUTORIAL_CONTENT[slug] : undefined

  const teardown = useCallback(() => {
    isTearingDownRef.current = true
    observerRef.current?.disconnect()
    observerRef.current = null
    driverRef.current?.destroy()
    driverRef.current = null
    isTearingDownRef.current = false
  }, [])

  // Chaque étape est une route : on ferme le tuto de l'étape quittée.
  useEffect(() => teardown, [slug, teardown])

  const start = useCallback(() => {
    if (!steps?.length) {
      return
    }

    // driver.js calcule « x sur y » sur la longueur totale des étapes fournies, et
    // n'ignore pas une ancre absente : il affiche un popover orphelin centré. On résout
    // donc en amont pour que la progression annoncée corresponde aux bulles montrées.
    const reachable = steps
      .map((step) => ({ ...step, initial: resolveAnchor(step.anchor) }))
      .filter((step): step is typeof step & { initial: HTMLElement } => Boolean(step.initial))

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
      steps: reachable.map(({ anchor, initial, title, description, side, align }) => ({
        // Résolu à chaque bulle plutôt qu'une fois pour toutes : `refresh()` ne
        // re-résout pas la cible et se recalerait sur un nœud détaché.
        element: () => resolveAnchor(anchor) ?? initial,
        popover: { align, description, side, title },
      })),
      onPopoverRender: (popover) => {
        popover.closeButton.setAttribute('aria-label', "Fermer l'aide")
      },
      onDestroyed: () => {
        if (!isTearingDownRef.current) {
          triggerRef.current?.focus()
        }
      },
    })

    driverRef.current = instance

    // Le contenu bouge sous le projecteur : alertes « pic de ménages », graphiques montés
    // après coup, requêtes react-query qui se résolvent. `refresh()` est throttlé en
    // interne et ne touche pas au focus, contrairement à `moveTo()`.
    observerRef.current = new ResizeObserver(() => driverRef.current?.refresh())
    observerRef.current.observe(document.body)

    instance.drive()
  }, [steps, teardown, triggerRef])

  return { hasTutorial: Boolean(steps?.length), start }
}
