import { NextRequest, NextResponse } from 'next/server'
import { authFetch, getSession } from '~/lib/auth/server'
import type { EpciRouteParams } from '~/types/simulation-page-props'

export async function GET(_: NextRequest, { params }: EpciRouteParams) {
  const { epci } = await params
  const session = await getSession()

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const res = await authFetch(`/epcis/${epci}/bassin`)
  if (!res.ok) {
    return NextResponse.json({ error: 'Failed to fetch bassin epcis list' }, { status: res.status })
  }

  const data = await res.json()
  return NextResponse.json(data)
}
