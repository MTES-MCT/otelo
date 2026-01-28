import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '~/lib/auth/auth.config'
import { TSession } from '~/types/next-auth'

export async function POST(request: Request) {
  const session = (await getServerSession(authOptions)) as TSession

  if (!session?.accessToken) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
  }

  const { userId } = await request.json()

  if (!userId) {
    return NextResponse.json({ error: 'UserId is required' }, { status: 400 })
  }

  try {
    const res = await fetch(`${process.env.NEXT_OTELO_API_URL}/auth/impersonate/${userId}`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${session.accessToken}`,
        'Content-Type': 'application/json',
      },
    })

    if (!res.ok) {
      const errorData = await res.json()
      return NextResponse.json({ error: errorData.message || 'Failed to start impersonation' }, { status: res.status })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error starting impersonation:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE() {
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
    const res = await fetch(`${process.env.NEXT_OTELO_API_URL}/auth/impersonate`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${session.accessToken}`,
        'Content-Type': 'application/json',
      },
    })

    if (!res.ok) {
      const errorData = await res.json()
      return NextResponse.json({ error: errorData.message || 'Failed to stop impersonation' }, { status: res.status })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error stopping impersonation:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
