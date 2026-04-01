import { NextResponse } from 'next/server'
import { authFetch, getSession } from '~/lib/auth/server'
import type { IdRouteParams } from '~/types/simulation-page-props'

export async function GET(_: Request, { params }: IdRouteParams) {
  const { id } = await params
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const res = await authFetch(`/simulations/${id}/share`)

  if (!res.ok) {
    return NextResponse.json({ error: 'Failed to fetch share status' }, { status: res.status })
  }

  const data = await res.json()
  return NextResponse.json(data)
}

export async function POST(_: Request, { params }: IdRouteParams) {
  const { id } = await params
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const res = await authFetch(`/simulations/${id}/share/toggle`, { method: 'POST' })

  if (!res.ok) {
    return NextResponse.json({ error: 'Failed to toggle share' }, { status: res.status })
  }

  const data = await res.json()
  return NextResponse.json(data)
}
