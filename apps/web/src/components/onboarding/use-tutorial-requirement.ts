'use client'

import { useCallback } from 'react'
import { useSession } from '~/lib/auth/client'
import { clearTutorialProgress } from './tutorial-progress'

/**
 * Le didacticiel de création est obligatoire tant que le compte ne l'a pas terminé une fois.
 *
 * Jamais en impersonation : l'administrateur ne doit ni subir le parcours, ni le valider à la
 * place de l'utilisateur.
 */
export const useTutorialRequirement = () => {
  const { data: session, isPending, refetch } = useSession()
  const userId = session?.user.id
  const isRequired = !!session && !session.user.tutorialCompletedAt && !session.session.impersonatedBy

  const markCompleted = useCallback(async () => {
    if (!userId) return
    const response = await fetch('/api/users/me/tutorial-completed', { method: 'POST' })
    if (!response.ok) return
    clearTutorialProgress(userId)
    await refetch()
  }, [userId, refetch])

  return { isPending, isRequired, markCompleted, userId }
}
