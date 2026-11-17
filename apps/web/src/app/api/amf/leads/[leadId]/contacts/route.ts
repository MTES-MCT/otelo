import { amfFetch, amfProxyError, relayAmfResponse } from '~/lib/amf/amf-fetch'

export async function POST(request: Request, { params }: { params: Promise<{ leadId: string }> }) {
  try {
    const { leadId } = await params
    const body = await request.text()
    const res = await amfFetch(`/amf/leads/${encodeURIComponent(leadId)}/contacts`, { method: 'POST', body })
    return relayAmfResponse(res)
  } catch (error) {
    return amfProxyError(error)
  }
}
