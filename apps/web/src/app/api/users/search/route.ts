import { NextResponse } from 'next/server'
import { authFetch, getSession } from '~/lib/auth/server'

export async function GET(request: Request) {
  const session = await getSession()

  const url = new URL(request.url)
  const q = url.searchParams.get('q')

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const res = await authFetch(`/users/search?q=${q}`)

  if (!res.ok) {
    return NextResponse.json({ error: 'Failed to fetch user by query' }, { status: res.status })
  }

  const data = await res.json()
  return NextResponse.json(data)
}
