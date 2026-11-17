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
 * Refuse la requête si la session n'est pas celle d'un administrateur.
 *
 * Renvoie la réponse d'erreur à retourner telle quelle, ou `null` pour laisser passer.
 * Destiné aux routes que les helpers ci-dessous ne couvrent pas — écritures, envois de
 * fichiers — pour que le contrôle de rôle s'écrive partout de la même façon.
 *
 * L'API refait le même contrôle : ce garde-fou évite surtout un aller-retour réseau
 * inutile, et évite qu'une régression côté API expose des données personnelles à tout
 * compte connecté.
 */
export async function requireAdmin(): Promise<NextResponse | null> {
  const session = await getSession()

  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  return null
}

export async function requirePilotageAccess(): Promise<NextResponse | null> {
  const session = await getSession()

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const isAdmin = session.user.role === 'ADMIN'
  const isRegionalAgent = session.user.type === 'DREAL' && !!session.user.region

  if (!isAdmin && !isRegionalAgent) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  return null
}

export async function proxyAdminJson(path: string, request: Request, extraParams: readonly string[] = []) {
  const denied = await requireAdmin()
  if (denied) return denied

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
  const denied = await requireAdmin()
  if (denied) return denied

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
