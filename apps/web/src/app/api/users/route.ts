import { NextResponse } from 'next/server'
import { authFetch, getSession, unauthFetch } from '~/lib/auth/server'

export async function GET(request: Request) {
  const session = await getSession()

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const query = searchParams.toString()
  const res = await authFetch(`/users${query ? `?${query}` : ''}`)

  if (!res.ok) {
    return NextResponse.json({ error: 'Failed to fetch users list' }, { status: res.status })
  }

  const data = await res.json()
  return NextResponse.json(data)
}

export async function POST(request: Request) {
  const body = await request.json()
  const res = await unauthFetch('/auth/sign-up/email', {
    headers: {
      'Content-Type': 'application/json',
    },
    method: 'POST',
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    return NextResponse.json({ error: 'Failed to create user' }, { status: res.status })
  }

  const data = await res.json()
  return NextResponse.json(data)
}
