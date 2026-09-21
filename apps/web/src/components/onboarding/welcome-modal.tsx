'use client'

import { createModal } from '@codegouvfr/react-dsfr/Modal'
import { useIsModalOpen } from '@codegouvfr/react-dsfr/Modal/useIsModalOpen'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import { trackEvent } from '~/lib/tracking'
import { OTELO_INTRO } from './welcome-content'

const DASHBOARD_PATH = '/tableaux-de-bord'
/** `tuto=1` ouvre le didacticiel de l'étape sans attendre de clic. */
const FIRST_STEP_PATH = '/simulation/choix-du-territoire?tuto=1'

/** Le DSFR instrumente le dialogue après coup : la première tentative d'ouverture peut tomber trop tôt. */
const OPEN_RETRY_MS = 100
const OPEN_TIMEOUT_MS = 3_000

/**
 * Marqueur de « présentation déjà proposée ».
 *
 * Volontairement local plutôt qu'en base : la présentation est un dispositif de phase de
 * test, et un champ sur `users` coûterait une migration, un `additionalFields` better-auth
 * et un endpoint pour un booléen qu'on veut pouvoir réinitialiser d'un clic en recette.
 * Contrepartie assumée : le compte revoit la présentation sur un autre navigateur.
 */
const SEEN_KEY = 'otelo.onboarding.welcomeSeen'

/** Le stockage local jette en navigation privée ou cookies bloqués : jamais bloquant ici. */
const hasBeenSeen = (): boolean => {
  try {
    return localStorage.getItem(SEEN_KEY) === '1'
  } catch {
    return false
  }
}

const markAsSeen = (): void => {
  try {
    localStorage.setItem(SEEN_KEY, '1')
  } catch {
    // Sans stockage, la présentation reviendra : c'est préférable à une page qui casse.
  }
}

const WelcomeModal = createModal({ id: 'otelo-welcome-modal', isOpenedByDefault: false })

/**
 * Présentation d'Otelo à la première arrivée sur le tableau de bord, et porte d'entrée du
 * didacticiel.
 *
 * Le didacticiel était jusqu'ici entièrement opt-in : rien ne s'ouvrait sans clic sur le
 * bouton d'aide, et les tests utilisateurs ne portaient donc jamais dessus. Cette modale
 * fait entrer le nouvel arrivant dans le parcours plutôt que d'attendre qu'il le demande.
 *
 * Elle est indépendante de la modale de type d'organisation : elle ne consulte ni la
 * session, ni `?selectType`. Les deux peuvent donc se présenter au même passage, et c'est
 * assumé — faire dépendre la présentation du profil la rendait invisible dès que la
 * session tardait ou que le type manquait.
 */
export function OteloWelcomeModal() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const router = useRouter()
  const [isMounted, setIsMounted] = useState(false)
  // Une fois la présentation réellement affichée, elle ne doit plus se rouvrir : sans ce
  // drapeau, la fermeture repasserait `isOpen` à `false` et relancerait les tentatives.
  const hasBeenDisclosedRef = useRef(false)

  const isOpen = useIsModalOpen(WelcomeModal, {
    onDisclose: () => {
      hasBeenDisclosedRef.current = true
      // Marqué à l'affichage effectif, pas à l'intention : si le DSFR n'a pas réussi à
      // ouvrir le dialogue, la présentation doit rester due au prochain passage.
      markAsSeen()
    },
  })

  // Échappatoire de recette : rejoue la présentation sans avoir à vider le stockage local.
  const isForced = searchParams.get('bienvenue') !== null

  useEffect(() => {
    if (pathname !== DASHBOARD_PATH || (hasBeenSeen() && !isForced)) {
      return
    }

    setIsMounted(true)
  }, [pathname, isForced])

  useEffect(() => {
    if (!isMounted || isOpen || hasBeenDisclosedRef.current) {
      return
    }

    const attempt = () => {
      try {
        WelcomeModal.open()
      } catch {
        // `window.dsfr` n'a pas encore pris le dialogue en charge : on retentera.
      }
    }

    attempt()
    const deadline = Date.now() + OPEN_TIMEOUT_MS
    const timer = setInterval(() => {
      if (Date.now() > deadline) {
        clearInterval(timer)
        return
      }
      attempt()
    }, OPEN_RETRY_MS)

    return () => clearInterval(timer)
  }, [isMounted, isOpen])

  if (!isMounted) {
    return null
  }

  return (
    <WelcomeModal.Component
      title={OTELO_INTRO.title}
      size="medium"
      buttons={[
        {
          priority: 'secondary',
          children: OTELO_INTRO.laterLabel,
          onClick: () => trackEvent({ action: 'presentation otelo', category: 'Aide', name: 'plus tard' }),
        },
        {
          priority: 'primary',
          children: OTELO_INTRO.startLabel,
          onClick: () => {
            trackEvent({ action: 'presentation otelo', category: 'Aide', name: 'commencer' })
            router.push(FIRST_STEP_PATH)
          },
        },
      ]}
    >
      {OTELO_INTRO.paragraphs.map((paragraph) => (
        // Fragment HTML écrit dans `welcome-content.ts`, jamais reçu de l'extérieur.
        <p key={paragraph} dangerouslySetInnerHTML={{ __html: paragraph }} />
      ))}
    </WelcomeModal.Component>
  )
}
