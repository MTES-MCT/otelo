import { NextResponse } from 'next/server'
import { authFetch, getSession } from '~/lib/auth/server'
import type { IdRouteParams } from '~/types/simulation-page-props'

export async function GET(_: Request, { params }: IdRouteParams) {
  const { id } = await params
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const res = await authFetch(`/simulations/${id}/collaborators`)

  if (!res.ok) {
    return NextResponse.json({ error: 'Failed to fetch collaborators' }, { status: res.status })
  }

  return NextResponse.json(await res.json())
}

export async function POST(request: Request, { params }: IdRouteParams) {
  const { id } = await params
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()

  const res = await authFetch(`/simulations/${id}/collaborators`, {
    body: JSON.stringify(body),
    method: 'POST',
  })

  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: 'Failed to invite collaborator' }))
    return NextResponse.json(error, { status: res.status })
  }

  return NextResponse.json(await res.json())
}
