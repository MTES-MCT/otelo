import { TEpci } from '@shared'
import { authFetch, getSession } from '~/lib/auth/server'

export const getBassinEpcis = async (epci: string) => {
  const session = await getSession()

  if (!session) {
    throw new Error('Unauthorized')
  }

  const res = await authFetch(`/epcis/${epci}/bassin`)

  if (!res.ok) {
    return []
  }
  return (await res.json()) as TEpci[]
}
