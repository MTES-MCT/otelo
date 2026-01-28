import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '~/lib/auth/auth.config'
import type { IdRouteParams } from '~/types/simulation-page-props'

export async function GET(_: Request, { params }: IdRouteParams) {
  const { id } = await params
  const session = await getServerSession(authOptions)
  if (!session?.accessToken) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const res = await fetch(`${process.env.NEXT_OTELO_API_URL}/simulations/${id}/results`, {
    headers: {
      Authorization: `Bearer ${session.accessToken}`,
      'Content-Type': 'application/json',
    },
  })

  if (!res.ok) {
    return NextResponse.json({ error: 'Failed to fetch simulation results' }, { status: res.status })
  }

  const data = await res.json()
  return NextResponse.json(data)
}

export async function PATCH(request: Request, { params }: IdRouteParams) {
  const { id } = await params
  const session = await getServerSession(authOptions)
  if (!session?.accessToken) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()

  const res = await fetch(`${process.env.NEXT_OTELO_API_URL}/simulations/${id}`, {
    body: JSON.stringify(body),
    headers: {
      Authorization: `Bearer ${session.accessToken}`,
      'Content-Type': 'application/json',
    },
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
  const session = await getServerSession(authOptions)
  if (!session?.accessToken) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const res = await fetch(`${process.env.NEXT_OTELO_API_URL}/simulations/${id}`, {
    headers: {
      Authorization: `Bearer ${session.accessToken}`,
      'Content-Type': 'application/json',
    },
    method: 'DELETE',
  })

  if (!res.ok) {
    return NextResponse.json({ error: 'Failed to delete simulation' }, { status: res.status })
  }

  return NextResponse.json({ success: true })
}
