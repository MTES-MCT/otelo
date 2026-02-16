import { NextResponse } from 'next/server'
import { authFetch, getSession } from '~/lib/auth/server'
import type { CodeRouteParams } from '~/types/simulation-page-props'

export async function GET(request: Request, { params }: CodeRouteParams) {
  const { code } = await params
  const session = await getSession()

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const category = searchParams.get('category')

  let path = `/epci-neighbors/${code}`
  if (category) {
    path += `?category=${category}`
  }

  const res = await authFetch(path)

  if (!res.ok) {
    return NextResponse.json({ error: 'Failed to fetch epci neighbors' }, { status: res.status })
  }

  const data = await res.json()
  return NextResponse.json(data)
}
