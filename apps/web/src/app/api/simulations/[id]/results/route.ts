import { NextResponse } from 'next/server'
import { authFetch, getSession } from '~/lib/auth/server'
import type { IdRouteParams } from '~/types/simulation-page-props'

export async function GET(_request: Request, { params }: IdRouteParams) {
  const { id } = await params
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const res = await authFetch(`/simulations/${id}/results`, { method: 'GET' })

  if (!res.ok) {
    return NextResponse.json({ error: 'Failed to compute simulation results' }, { status: res.status })
  }

  const data = await res.json()
  return NextResponse.json(data)
}
