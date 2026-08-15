import { proxyAdminCsv } from '~/lib/api/admin-proxy'

export async function GET(request: Request, { params }: { params: Promise<{ dataset: string }> }) {
  const { dataset } = await params

  // Le nom du jeu de données est validé côté API, contre son propre catalogue :
  // la liste des exports n'a pas à être maintenue en double.
  return proxyAdminCsv(`/statistics/exports/${encodeURIComponent(dataset)}`, request)
}
