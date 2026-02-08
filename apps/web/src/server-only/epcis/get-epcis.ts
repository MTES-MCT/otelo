import { TEpci } from '@shared'
import { authFetch, getSession } from '~/lib/auth/server'

export const getEpcis = async (epcis: Array<string>, baseEpci?: string) => {
  const session = await getSession()

  if (!session) {
    throw new Error('Unauthorized')
  }

  const searchParams = new URLSearchParams({ epcis: epcis.join(',') })
  if (baseEpci) {
    searchParams.append('baseEpci', baseEpci)
  }

  const res = await authFetch(`/epcis?${searchParams}`)
  if (!res.ok) {
    throw new Error('Failed to get epcis list')
  }
  return res.json() as Promise<TEpci[]>
}
