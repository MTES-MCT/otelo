import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '~/lib/auth/auth.config'

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions)

  if (!session?.accessToken) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const searchParams = request.nextUrl.searchParams
  const codes = searchParams.get('codes')

  if (!codes) {
    return NextResponse.json({ error: 'Missing codes parameter' }, { status: 400 })
  }

  const res = await fetch(`${process.env.NEXT_OTELO_API_URL}/epcis/contiguous?codes=${codes}`, {
    headers: {
      Authorization: `Bearer ${session.accessToken}`,
      'Content-Type': 'application/json',
    },
  })

  if (!res.ok) {
    return NextResponse.json({ error: 'Failed to fetch contiguous epcis' }, { status: res.status })
  }

  const data = await res.json()
  return NextResponse.json(data)
}
