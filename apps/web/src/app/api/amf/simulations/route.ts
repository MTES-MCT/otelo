import { amfFetch, amfProxyError, relayAmfResponse } from '~/lib/amf/amf-fetch'

export async function POST(request: Request) {
  try {
    const body = await request.text()
    const res = await amfFetch('/amf/simulations', { method: 'POST', body })
    return relayAmfResponse(res)
  } catch (error) {
    return amfProxyError(error)
  }
}
