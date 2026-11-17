import { CREATION_STEPS } from '~/components/simulations/settings/wizard-steps'

/**
 * Avancement du didacticiel obligatoire, tant qu'il n'est pas terminé.
 *
 * Seule la fin du parcours est persistée en base (`users.tutorial_completed_at`) : c'est elle qui
 * lève l'obligation. Le détail des bulles déjà vues reste local, par compte, pour qu'un retour
 * sur une étape ou un rechargement ne rejoue pas ce qui a déjà été lu. Sur un autre navigateur,
 * l'utilisateur reprend le didacticiel depuis le début.
 */
type TutorialProgress = {
  welcomeDone: boolean
  seen: string[]
}

const storageKey = (userId: string) => `otelo.onboarding.tutorialProgress.${userId}`

const read = (userId: string): TutorialProgress => {
  try {
    const raw = localStorage.getItem(storageKey(userId))
    const parsed = raw ? (JSON.parse(raw) as Partial<TutorialProgress>) : {}
    return { seen: Array.isArray(parsed.seen) ? parsed.seen : [], welcomeDone: parsed.welcomeDone === true }
  } catch {
    return { seen: [], welcomeDone: false }
  }
}

const write = (userId: string, progress: TutorialProgress): void => {
  try {
    localStorage.setItem(storageKey(userId), JSON.stringify(progress))
  } catch {
    // Sans stockage, les bulles déjà vues seront rejouées : c'est préférable à une page qui casse.
  }
}

/** Identifiant d'une bulle : son rang dans le registre de l'étape, stable d'un rendu à l'autre. */
export const bubbleKey = (slug: string, index: number) => `${slug}:${index}`

export const isWelcomeDone = (userId: string): boolean => read(userId).welcomeDone

export const markWelcomeDone = (userId: string): void => {
  write(userId, { ...read(userId), welcomeDone: true })
}

export const isBubbleSeen = (userId: string, key: string): boolean => read(userId).seen.includes(key)

export const markBubbleSeen = (userId: string, key: string): void => {
  const progress = read(userId)
  if (!progress.seen.includes(key)) {
    write(userId, { ...progress, seen: [...progress.seen, key] })
  }
}

/** Chaque étape du parcours de création a été déroulée au moins en partie. */
export const hasSeenEveryCreationStep = (userId: string): boolean => {
  const { seen } = read(userId)
  return CREATION_STEPS.every(({ slug }) => seen.some((key) => key.startsWith(`${slug}:`)))
}

export const clearTutorialProgress = (userId: string): void => {
  try {
    localStorage.removeItem(storageKey(userId))
  } catch {
    // Rien à nettoyer si le stockage est indisponible.
  }
}
