import { type TPublicStatistics, ZPublicStatistics } from '@otelo/shared'

/** Valide la réponse de l'API ; `null` si elle ne respecte pas le schéma. */
export function toPublicStatisticsOrNull(payload: unknown): TPublicStatistics | null {
  const result = ZPublicStatistics.safeParse(payload)
  return result.success ? result.data : null
}

/**
 * Statistiques publiques, sans authentification, mises en cache une heure par Next.
 * Ne lève jamais : erreur réseau, statut non OK ou réponse invalide renvoient `null`,
 * et la page affiche alors un encart d'indisponibilité.
 */
export async function getPublicStatistics(): Promise<TPublicStatistics | null> {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_AUTH_API_URL}/api/statistics/public`, {
      next: { revalidate: 3600, tags: ['public-statistics'] },
    })
    if (!res.ok) {
      console.error(`Statistiques publiques indisponibles (${res.status})`)
      return null
    }
    const statistics = toPublicStatisticsOrNull(await res.json())
    if (!statistics) console.error('Statistiques publiques : réponse non conforme au schéma')
    return statistics
  } catch (error) {
    console.error('Statistiques publiques indisponibles :', error instanceof Error ? error.message : error)
    return null
  }
}
