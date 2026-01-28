import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '~/lib/auth/auth.config'

export async function POST(request: Request) {
  const body = await request.json()
  const session = await getServerSession(authOptions)

  if (!session?.accessToken) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const res = await fetch(`${process.env.NEXT_OTELO_API_URL}/export-powerpoint`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${session.accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    return NextResponse.json({ error: 'Failed to request powerpoint' }, { status: res.status })
  }

  const data = await res.json()
  return NextResponse.json(data)
}
