import { proxyAdminCsv } from '~/lib/api/admin-proxy'

export async function GET(request: Request) {
  return proxyAdminCsv('/users/export/csv', request)
}
