import { authFetch, getSession } from '~/lib/auth/server'
import { TPopulationDemographicEvolution } from '~/schemas/demographic-evolution'

export const getPopulationDemographicEvolutionByEpci = async (epcis: string[]) => {
  const session = await getSession()

  if (!session) {
    throw new Error('Unauthorized')
  }

  const res = await authFetch(`/demographic-evolution/population?epciCodes=${epcis.join(',')}`)
  if (!res.ok) {
    throw new Error('Failed to get population demographic evolution by epci')
  }
  return res.json() as Promise<TPopulationDemographicEvolution>
}
