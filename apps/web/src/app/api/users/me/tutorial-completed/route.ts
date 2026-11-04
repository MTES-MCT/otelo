import { NextResponse } from 'next/server'
import { authFetch, getSession } from '~/lib/auth/server'

export async function POST() {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const response = await authFetch('/users/me/tutorial-completed', { method: 'POST' })

  if (!response.ok) {
    return NextResponse.json({ error: 'Failed to mark tutorial as completed' }, { status: response.status })
  }

  return new NextResponse(null, { status: 204 })
}
