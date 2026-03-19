import { getCookieHeader, getSession } from '~/lib/auth/server'

const API_URL = `${process.env.NEXT_PUBLIC_AUTH_API_URL}/api` || 'http://localhost:4200/api'

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await getSession()
  if (!session) {
    return new Response('Unauthorized', { status: 401 })
  }

  const cookieHeader = await getCookieHeader()

  const upstream = await fetch(`${API_URL}/simulations/${id}/events`, {
    headers: {
      cookie: cookieHeader,
      Accept: 'text/event-stream',
    },
    signal: AbortSignal.timeout(1_800_000), // 30 min max
  })

  if (!upstream.ok || !upstream.body) {
    return new Response('Failed to connect to event stream', { status: upstream.status })
  }

  return new Response(upstream.body, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
    },
  })
}
