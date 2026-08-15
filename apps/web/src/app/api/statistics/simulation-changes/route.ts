import { proxyAdminJson } from '~/lib/api/admin-proxy'

export async function GET(request: Request) {
  return proxyAdminJson('/statistics/simulation-changes', request, ['page', 'action', 'search'])
}
