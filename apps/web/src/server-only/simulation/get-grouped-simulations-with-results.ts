import { notFound } from 'next/navigation'
import { authFetch, getSession } from '~/lib/auth/server'
import { TGroupedSimulationWithResults } from '~/schemas/simulation'

export const getGroupedSimulationWithResults = async (id: string) => {
  const session = await getSession()

  if (!session) {
    throw new Error('Unauthorized')
  }

  const res = await authFetch(`/simulations/${id}/results`, {
    cache: 'no-store',
  })

  if (!res.ok) {
    notFound()
  }
  return res.json() as Promise<TGroupedSimulationWithResults>
}
