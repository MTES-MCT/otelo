import { NextRequest, NextResponse } from 'next/server'
import { authFetch } from '~/lib/auth/server'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ code: string }> }) {
  const { code } = await params
  const res = await authFetch(`/docurba/epci/${code}`)
  if (!res.ok) return new Response(null, { status: 204 })
  const data = await res.json()
  return NextResponse.json(data, {
    headers: { 'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400' },
  })
}
