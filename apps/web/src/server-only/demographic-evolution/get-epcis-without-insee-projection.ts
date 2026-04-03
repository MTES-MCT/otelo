import { authFetch, getSession } from '~/lib/auth/server'

export const getEpcisWithoutInseeProjection = async (epcis: string[]): Promise<string[]> => {
  const session = await getSession()

  if (!session) {
    throw new Error('Unauthorized')
  }

  const res = await authFetch(`/demographic-evolution/no-insee-projection?epciCodes=${epcis.join(',')}`)
  if (!res.ok) {
    throw new Error('Failed to get EPCIs without INSEE projection')
  }
  return res.json() as Promise<string[]>
}
