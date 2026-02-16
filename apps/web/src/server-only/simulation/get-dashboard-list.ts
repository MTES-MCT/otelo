import { TEpci } from '@shared'
import { notFound } from 'next/navigation'
import { authFetch, getSession } from '~/lib/auth/server'
import { TSimulationWithRelations } from '~/schemas/simulation'

export const getDashboardList = async () => {
  const session = await getSession()
  if (!session) {
    notFound()
  }

  const res = await authFetch('/simulations/dashboard-list')

  if (!res.ok) {
    const errorText = await res.text()
    throw new Error(`Failed to get dashboard list: ${res.status} - ${errorText}`)
  }

  return res.json() as Promise<
    Array<{
      id: string
      name: string
      simulations: TSimulationWithRelations[]
      epcis: Omit<TEpci, 'region'>[]
    }>
  >
}
