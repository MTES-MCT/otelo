import { NextResponse } from 'next/server'
import { authFetch, getSession } from '~/lib/auth/server'

export async function GET(request: Request) {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const codes = searchParams.get('codes')

  const res = await authFetch(`/epcis/contours?codes=${codes}`)
  if (!res.ok) {
    return NextResponse.json({ error: 'Failed to fetch epci contours' }, { status: res.status })
  }

  const data = await res.json()
  return NextResponse.json(data)
}
