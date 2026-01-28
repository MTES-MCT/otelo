import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '~/lib/auth/auth.config'
import { TSession } from '~/types/next-auth'

export async function GET() {
  const session = (await getServerSession(authOptions)) as TSession

  if (!session?.accessToken) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const isAdmin = session.user.role === 'ADMIN'
  const isImpersonating = session.impersonatorId && session.impersonatedUserId

  if (!isAdmin && !isImpersonating) {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
  }

  try {
    const res = await fetch(`${process.env.NEXT_OTELO_API_URL}/auth/impersonation-status`, {
      headers: {
        Authorization: `Bearer ${session.accessToken}`,
        'Content-Type': 'application/json',
      },
    })

    if (!res.ok) {
      const errorData = await res.json()
      return NextResponse.json({ error: errorData.message || 'Failed to fetch impersonation status' }, { status: res.status })
    }

    const data = await res.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('Error fetching impersonation status:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
