import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '~/lib/auth/auth.config'

export async function GET(request: Request) {
  const session = await getServerSession(authOptions)

  const url = new URL(request.url)
  const q = url.searchParams.get('q')

  if (!session?.accessToken) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const res = await fetch(`${process.env.NEXT_OTELO_API_URL}/users/search?q=${q}`, {
    headers: {
      Authorization: `Bearer ${session.accessToken}`,
      'Content-Type': 'application/json',
    },
  })

  if (!res.ok) {
    return NextResponse.json({ error: 'Failed to fetch user by query' }, { status: res.status })
  }

  const data = await res.json()
  return NextResponse.json(data)
}
