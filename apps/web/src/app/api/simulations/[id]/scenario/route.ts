import { NextResponse } from 'next/server'
import { authFetch, getSession } from '~/lib/auth/server'
import type { IdRouteParams } from '~/types/simulation-page-props'

export async function GET(_: Request, { params }: IdRouteParams) {
  const { id } = await params
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const res = await authFetch(`/simulations/${id}/scenario`, {
    headers: {
      'Cache-Control': 'no-store',
    },
  })

  if (!res.ok) {
    return NextResponse.json({ error: 'Failed to fetch simulation scenario' }, { status: res.status })
  }

  const data = await res.json()
  return NextResponse.json(data)
}

export async function PUT(request: Request, { params }: IdRouteParams) {
  const { id } = await params
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()

  const res = await authFetch(`/simulations/${id}/scenario`, {
    body: JSON.stringify(body),
    method: 'PUT',
  })

  if (!res.ok) {
    return NextResponse.json({ error: 'Failed to update simulation scenario' }, { status: res.status })
  }

  const data = await res.json()
  return NextResponse.json(data)
}
