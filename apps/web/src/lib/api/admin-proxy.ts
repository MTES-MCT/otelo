import { NextResponse } from 'next/server'
import { authFetch, getSession } from '~/lib/auth/server'

/** Paramètres de période, propagés tels quels à l'API qui les valide. */
const RANGE_PARAMS = ['from', 'to'] as const

function buildQuery(request: Request, extraParams: readonly string[] = []): string {
  const incoming = new URL(request.url).searchParams
  const forwarded = new URLSearchParams()

  for (const key of [...RANGE_PARAMS, ...extraParams]) {
    const value = incoming.get(key)

    if (value) {
      forwarded.set(key, value)
    }
  }

  const query = forwarded.toString()
  return query ? `?${query}` : ''
}

/**
 * Relaie un endpoint d'administration de l'API NestJS, avec le contrôle de rôle côté Next.
 *
 * L'API refait le même contrôle : ce garde-fou évite surtout un aller-retour réseau
 * inutile et une fuite de la forme des erreurs de l'API vers le navigateur.
 *
 * Seuls les paramètres attendus sont propagés : on ne relaie jamais l'URL entrante
 * telle quelle vers un service interne.
 */
export async function proxyAdminJson(path: string, request: Request, extraParams: readonly string[] = []) {
  const session = await getSession()

  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const response = await authFetch(`${path}${buildQuery(request, extraParams)}`)

  if (!response.ok) {
    return NextResponse.json({ error: `Failed to fetch ${path}` }, { status: response.status })
  }

  return NextResponse.json(await response.json())
}

/**
 * Relaie un export CSV en conservant le nom de fichier décidé par l'API.
 *
 * Le corps est retransmis tel quel : le ré-encoder ferait perdre le BOM UTF-8, et donc
 * les accents à l'ouverture dans Excel.
 */
export async function proxyAdminCsv(path: string, request: Request, extraParams: readonly string[] = []) {
  const session = await getSession()

  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const response = await authFetch(`${path}${buildQuery(request, extraParams)}`)

  if (!response.ok) {
    return NextResponse.json({ error: `Failed to export ${path}` }, { status: response.status })
  }

  return new NextResponse(await response.arrayBuffer(), {
    headers: {
      'Content-Disposition': response.headers.get('content-disposition') ?? 'attachment',
      'Content-Type': response.headers.get('content-type') ?? 'text/csv; charset=utf-8',
    },
  })
}
