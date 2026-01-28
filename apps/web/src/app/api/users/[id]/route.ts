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

  const { type } = await request.json()

  const response = await fetch(`${process.env.NEXT_OTELO_API_URL}/users/${id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session.accessToken}`,
    },
    body: JSON.stringify({
      type,
    }),
  })

  if (!response.ok) {
    throw new Error('Failed to update user type')
  }

  const updatedUser = await response.json()
  return NextResponse.json(updatedUser)
}
