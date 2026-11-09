import { amfFetch, amfProxyError, relayAmfResponse } from '~/lib/amf/amf-fetch'

export async function GET(_request: Request, { params }: { params: Promise<{ code: string }> }) {
  try {
    const { code } = await params
    const res = await amfFetch(`/amf/epcis/${encodeURIComponent(code)}`)
    return relayAmfResponse(res)
  } catch (error) {
    return amfProxyError(error)
  }
}
