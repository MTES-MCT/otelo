import { NextResponse } from 'next/server'
import { authFetch, getSession } from '~/lib/auth/server'
import type { IdRouteParams } from '~/types/simulation-page-props'

export async function POST(request: Request, { params }: IdRouteParams) {
  const { id } = await params
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()

  const res = await authFetch(`/simulations/${id}/actualize`, {
    body: JSON.stringify(body),
    method: 'POST',
  })

  if (!res.ok) {
    return NextResponse.json({ error: 'Failed to actualize simulation' }, { status: res.status })
  }

  const data = await res.json()
  return NextResponse.json(data)
}
