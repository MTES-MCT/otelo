import { NextRequest, NextResponse } from 'next/server'
import { authFetch, getSession } from '~/lib/auth/server'
import type { IdRouteParams } from '~/types/simulation-page-props'

export async function PATCH(request: NextRequest, { params }: IdRouteParams) {
  const { id } = await params
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { type } = await request.json()

  const response = await authFetch(`/users/${id}`, {
    method: 'PATCH',
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
