import { NextResponse } from 'next/server'
import { authFetch, getSession } from '~/lib/auth/server'

export async function GET(request: Request) {
  const session = await getSession()

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const epci = searchParams.get('epci')
  const type = searchParams.get('type')
  const populationType = searchParams.get('populationType')
  const source = searchParams.get('source')

  const res = await authFetch(`/data-visualisation?epci=${epci}&type=${type}&populationType=${populationType}&source=${source}`)

  if (!res.ok) {
    return NextResponse.json({ error: 'Failed to fetch data visualisation' }, { status: res.status })
  }

  const data = await res.json()
  return NextResponse.json(data)
}
