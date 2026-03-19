import { NextResponse } from 'next/server'
import { authFetch, getSession } from '~/lib/auth/server'
import type { IdRouteParams } from '~/types/simulation-page-props'

export async function GET(request: Request, { params }: IdRouteParams) {
  const { id } = await params
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const url = new URL(request.url)
  const limit = url.searchParams.get('limit') || '50'

  const res = await authFetch(`/simulations/${id}/activity?limit=${limit}`)

  if (!res.ok) {
    return NextResponse.json({ error: 'Failed to fetch activity' }, { status: res.status })
  }

  return NextResponse.json(await res.json())
}
