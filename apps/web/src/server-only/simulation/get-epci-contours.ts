import { EpciData } from '~/components/simulations/results/summary/simulation-needs-summary-map'
import { authFetch } from '~/lib/auth/server'

/**
 * Contours servis par notre API depuis `epci_contours`. Un échec masque la carte plutôt que de
 * faire tomber la page : le reste du résumé n'en dépend pas.
 */
export const getEpciContours = async (epciCodes: string[]): Promise<EpciData[]> => {
  if (epciCodes.length === 0) {
    return []
  }

  try {
    const res = await authFetch(`/epcis/contours?codes=${epciCodes.join(',')}`, { cache: 'no-store' })
    if (!res.ok) {
      console.error(`Contours indisponibles (${res.status}), carte masquée :`, epciCodes.join(','))
      return []
    }
    return (await res.json()) as EpciData[]
  } catch (error) {
    console.error('Contours indisponibles, carte masquée :', error instanceof Error ? error.message : error)
    return []
  }
}
