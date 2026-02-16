import { NextResponse } from 'next/server'
import { authFetch, getSession } from '~/lib/auth/server'
import type { IdRouteParams } from '~/types/simulation-page-props'

export async function GET(_: Request, { params }: IdRouteParams) {
  const { id } = await params
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const res = await authFetch(`/simulations/${id}/results`)

  if (!res.ok) {
    return NextResponse.json({ error: 'Failed to fetch simulation results' }, { status: res.status })
  }

  const data = await res.json()
  return NextResponse.json(data)
}

export async function PATCH(request: Request, { params }: IdRouteParams) {
  const { id } = await params
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()

  const res = await authFetch(`/simulations/${id}`, {
    body: JSON.stringify(body),
    method: 'PATCH',
  })

  if (!res.ok) {
    return NextResponse.json({ error: 'Failed to update simulation' }, { status: res.status })
  }

  const data = await res.json()
  return NextResponse.json(data)
}

export async function DELETE(_: Request, { params }: IdRouteParams) {
  const { id } = await params
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const res = await authFetch(`/simulations/${id}`, {
    method: 'DELETE',
  })

  if (!res.ok) {
    return NextResponse.json({ error: 'Failed to delete simulation' }, { status: res.status })
  }

  return NextResponse.json({ success: true })
}
