import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '~/lib/auth/auth.config'
import { TSession } from '~/types/next-auth'

export async function GET() {
  const session = (await getServerSession(authOptions)) as TSession
  if (!session) {
    return NextResponse.json({ error: 'Not logged in' }, { status: 401 })
  }

  try {
    const response = await fetch(`${process.env.NEXT_OTELO_API_URL}/auth/logout`, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.accessToken}`,
      },
    })

    if (!response.ok) {
      return NextResponse.json({ error: 'Failed to logout user' }, { status: response.status })
    }

    const data = await response.json()
    return NextResponse.json({ success: true, ...data })
  } catch (error) {
    console.error('Error during logout:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
