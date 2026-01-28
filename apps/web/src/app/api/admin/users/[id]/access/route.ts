import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '~/lib/auth/auth.config'
import type { IdRouteParams } from '~/types/simulation-page-props'

export async function PATCH(request: NextRequest, { params }: IdRouteParams) {
  const { id } = await params
  const session = await getServerSession(authOptions)

  if (!session?.accessToken) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()

  const res = await fetch(`${process.env.NEXT_OTELO_API_URL}/admin/users/${id}/access`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${session.accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    return NextResponse.json({ error: 'Failed to update user access' }, { status: res.status })
  }

  const data = await res.json()
  return NextResponse.json(data)
}
