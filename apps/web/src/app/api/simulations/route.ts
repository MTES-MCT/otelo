import { NextResponse } from 'next/server'
import { authFetch, getSession } from '~/lib/auth/server'

export async function GET() {
  const session = await getSession()

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const res = await authFetch('/simulations')

  if (!res.ok) {
    return NextResponse.json({ error: 'Failed to fetch simulations' }, { status: res.status })
  }

  const data = await res.json()
  return NextResponse.json(data)
}

export async function POST(request: Request) {
  const session = await getSession()

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()

  const response = await authFetch('/simulations', {
    body: JSON.stringify(body),
    method: 'POST',
  })
  if (!response.ok) {
    return NextResponse.json({ error: 'Failed to create simulation' }, { status: response.status })
  }
  const data = await response.json()
  return NextResponse.json(data)
}
