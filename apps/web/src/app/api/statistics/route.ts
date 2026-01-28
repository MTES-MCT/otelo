import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '~/lib/auth/auth.config'
import { TSession } from '~/types/next-auth'

export async function GET() {
  const session = (await getServerSession(authOptions)) as TSession | null

  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const res = await fetch(`${process.env.NEXT_OTELO_API_URL}/statistics`, {
    headers: {
      Authorization: `Bearer ${session.accessToken}`,
    },
  })

  if (!res.ok) {
    return NextResponse.json({ error: 'Failed to fetch statistics' }, { status: res.status })
  }

  const data = await res.json()
  return NextResponse.json(data)
}
