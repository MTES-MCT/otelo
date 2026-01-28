import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '~/lib/auth/auth.config'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const ids = searchParams.getAll('ids')

    const params = new URLSearchParams()
    ids.forEach((id) => params.append('ids', id))
    const queryString = params.toString()

    const response = await fetch(`${process.env.NEXT_OTELO_API_URL}/demographic-evolution-custom/find-many?${queryString}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${session.accessToken}`,
      },
    })

    const data = await response.json()

    if (!response.ok) {
      return NextResponse.json(data, { status: response.status })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('Error fetching multiple demographic evolution custom:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
