import { authFetch, getSession } from '~/lib/auth/server'
import { TOmphaleDemographicEvolution } from '~/schemas/demographic-evolution'

export const getOmphaleDemographicEvolutionByEpci = async (epcis: string[]) => {
  const session = await getSession()

  if (!session) {
    throw new Error('Unauthorized')
  }

  const res = await authFetch(`/demographic-evolution/omphale?epciCodes=${epcis.join(',')}`)
  if (!res.ok) {
    throw new Error('Failed to get omphale demographic evolution by epci')
  }
  return res.json() as Promise<TOmphaleDemographicEvolution>
}
