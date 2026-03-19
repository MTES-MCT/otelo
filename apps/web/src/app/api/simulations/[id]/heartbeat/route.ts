import { NextResponse } from 'next/server'
import { authFetch, getSession } from '~/lib/auth/server'
import type { IdRouteParams } from '~/types/simulation-page-props'

export async function POST(_request: Request, { params }: IdRouteParams) {
  const { id } = await params
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const res = await authFetch(`/simulations/${id}/heartbeat`, {
    method: 'POST',
  })

  if (!res.ok) {
    return NextResponse.json({ count: 0 })
  }

  return NextResponse.json(await res.json())
}

export async function DELETE(_request: Request, { params }: IdRouteParams) {
  const { id } = await params
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const res = await authFetch(`/simulations/${id}/heartbeat`, {
    method: 'DELETE',
  })

  if (!res.ok) {
    return NextResponse.json({ success: false })
  }

  return NextResponse.json(await res.json())
}
