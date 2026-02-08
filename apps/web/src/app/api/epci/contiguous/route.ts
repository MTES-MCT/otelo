import { NextRequest, NextResponse } from 'next/server'
import { authFetch, getSession } from '~/lib/auth/server'

export async function GET(request: NextRequest) {
  const session = await getSession()

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const searchParams = request.nextUrl.searchParams
  const codes = searchParams.get('codes')

  if (!codes) {
    return NextResponse.json({ error: 'Missing codes parameter' }, { status: 400 })
  }

  const res = await authFetch(`/epcis/contiguous?codes=${codes}`)

  if (!res.ok) {
    return NextResponse.json({ error: 'Failed to fetch contiguous epcis' }, { status: res.status })
  }

  const data = await res.json()
  return NextResponse.json(data)
}
