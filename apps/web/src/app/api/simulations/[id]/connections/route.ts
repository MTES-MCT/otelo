import { NextResponse } from 'next/server'
import { authFetch, getSession } from '~/lib/auth/server'
import type { IdRouteParams } from '~/types/simulation-page-props'

export async function GET(_: Request, { params }: IdRouteParams) {
  const { id } = await params
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const res = await authFetch(`/simulations/${id}/connections`)

  if (!res.ok) {
    return NextResponse.json({ count: 0 })
  }

  return NextResponse.json(await res.json())
}
