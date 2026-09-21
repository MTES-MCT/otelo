'use client'

import Button from '@codegouvfr/react-dsfr/Button'
import { FC, useEffect, useRef } from 'react'
import type { TutorialStep } from './tutorial-content'
import { useTutorial } from './use-tutorial'

type TutorialTriggerProps = {
  /** Étapes de l'écran courant, ou `undefined` si l'écran n'est pas couvert par le tuto. */
  steps: TutorialStep[] | undefined
  label: string
  /** Identifiant de l'écran, remonté avec les événements d'ouverture et de fin. */
  trackingName?: string
  /**
   * Ouvre le tuto sans attendre de clic, à la première prise en main.
   *
   * Piloté par l'appelant plutôt que par un état local : seul lui sait si l'utilisateur
   * arrive du mot de bienvenue ou revient sur ses pas.
   */
  autoStart?: boolean
  /**
   * Appelé une fois le démarrage automatique joué — qu'il ait abouti ou expiré.
   * L'appelant s'en sert pour retirer de l'URL le signal qui l'a déclenché.
   */
  onAutoStartSettled?: () => void
}

/** Les ancres sont montées par des composants clients : le premier essai peut tomber trop tôt. */
const AUTO_START_RETRY_MS = 150
const AUTO_START_TIMEOUT_MS = 3_000

/**
 * Bouton d'ouverture du mode tuto, commun à tous les écrans couverts.
 *
 * Ne rend rien si aucune étape n'est fournie : un bouton d'aide qui n'ouvre rien vaut moins
 * que pas de bouton du tout.
 */
export const TutorialTrigger: FC<TutorialTriggerProps> = ({ steps, label, trackingName, autoStart = false, onAutoStartSettled }) => {
  const triggerRef = useRef<HTMLButtonElement>(null)
  const { hasTutorial, start } = useTutorial(steps, triggerRef, trackingName)
  // Le démarrage automatique ne vaut que pour l'écran d'arrivée. Sans ce drapeau, le
  // changement d'étape renouvellerait l'identité des étapes, donc celle de `start`, et
  // rouvrirait le tuto à chaque étape suivante.
  const hasAutoStartedRef = useRef(false)

  useEffect(() => {
    if (!autoStart || hasAutoStartedRef.current) {
      return
    }

    const settle = () => {
      hasAutoStartedRef.current = true
      onAutoStartSettled?.()
    }

    if (start()) {
      settle()
      return
    }

    // Les données de l'écran peuvent arriver après le montage : on retente jusqu'à ce
    // qu'une ancre soit visible, puis on abandonne plutôt que de boucler indéfiniment.
    const deadline = Date.now() + AUTO_START_TIMEOUT_MS
    const timer = setInterval(() => {
      if (start() || Date.now() > deadline) {
        clearInterval(timer)
        settle()
      }
    }, AUTO_START_RETRY_MS)

    return () => clearInterval(timer)
  }, [autoStart, start, onAutoStartSettled])

  if (!hasTutorial) {
    return null
  }

  return (
    <Button
      priority="tertiary no outline"
      size="small"
      iconId="fr-icon-question-line"
      iconPosition="left"
      onClick={() => start()}
      type="button"
      nativeButtonProps={{ ref: triggerRef }}
    >
      {label}
    </Button>
  )
}
