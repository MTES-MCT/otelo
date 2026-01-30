import { TEpci } from '@shared'
import { getServerSession } from 'next-auth'
import { authOptions } from '~/lib/auth/auth.config'

export const getEpcis = async (epcis: Array<string>, baseEpci?: string) => {
  const session = await getServerSession(authOptions)

  if (!session?.accessToken) {
    throw new Error('Unauthorized')
  }

  const searchParams = new URLSearchParams({ epcis: epcis.join(',') })
  if (baseEpci) {
    searchParams.append('baseEpci', baseEpci)
  }

  const res = await fetch(`${process.env.NEXT_OTELO_API_URL}/epcis?${searchParams}`, {
    headers: {
      Authorization: `Bearer ${session.accessToken}`,
      'Content-Type': 'application/json',
    },
  })
  if (!res.ok) {
    throw new Error('Failed to get epcis list')
  }
  return res.json() as Promise<TEpci[]>
}
