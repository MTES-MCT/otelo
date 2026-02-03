import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '~/lib/auth/auth.config'

export async function GET() {
  const session = await getServerSession(authOptions)

  if (!session?.accessToken) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const res = await fetch(`${process.env.NEXT_OTELO_API_URL}/epci-neighbors/access-check`, {
    headers: {
      Authorization: `Bearer ${session.accessToken}`,
      'Content-Type': 'application/json',
    },
  })

  if (!res.ok) {
    return NextResponse.json({ error: 'Failed to check access' }, { status: res.status })
  }

  const data = await res.json()
  return NextResponse.json(data)
}
