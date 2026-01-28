import jwt from 'jsonwebtoken'
import { OAuthConfig } from 'next-auth/providers/oauth'

const issuer = process.env.NEXT_PRIVATE_OAUTH_PROCONNECT_ISSUER || 'https://proconnect.gouv.fr'

export type ProConnectProfile = {
  sub: string
  email: string
  given_name: string
  usual_name: string
  aud: string
  exp: number
  iat: number
  iss: string
}

export const proConnectProviderId = 'proconnect'

export const ProConnectProvider = () =>
  ({
    id: proConnectProviderId,
    name: 'ProConnect',
    type: 'oauth',
    allowDangerousEmailAccountLinking: true,
    clientId: process.env.NEXT_PRIVATE_OAUTH_PROCONNECT_CLIENT_ID,
    clientSecret: process.env.NEXT_PRIVATE_OAUTH_PROCONNECT_CLIENT_SECRET,
    issuer,
    authorization: {
      url: `${issuer}/api/v2/authorize`,
      params: {
        // https://github.com/numerique-gouv/agentconnect-documentation/blob/main/doc_fs/scope-claims.md#correspondance-entre-scope-et-claims-sur-agentconnect
        scope: 'openid given_name usual_name email',
        // acr_values: 'eidas1',
      },
    },
    token: {
      request: async (context: { params: { code?: string } }) => {
        const body = new URLSearchParams({
          grant_type: 'authorization_code',
          client_id: process.env.NEXT_PRIVATE_OAUTH_PROCONNECT_CLIENT_ID || '',
          client_secret: process.env.NEXT_PRIVATE_OAUTH_PROCONNECT_CLIENT_SECRET || '',
          redirect_uri: `${process.env.NEXT_PRIVATE_OAUTH_PROCONNECT_REDIRECT}/api/auth/callback/proconnect`,
          code: context.params.code || 'undefined',
        })

        const response = await fetch(`${issuer}/api/v2/token`, {
          method: 'POST',
          headers: {
            'content-type': 'application/x-www-form-urlencoded',
          },
          body,
        })

        if (!response.ok) {
          throw new Error(`Token request failed: ${response.statusText}`)
        }

        const tokens = await response.json()
        return { tokens }
      },
    },
    userinfo: {
      request: async ({ tokens }) => {
        const response = await fetch(`${issuer}/api/v2/userinfo`, {
          method: 'GET',
          headers: {
            Authorization: tokens.access_token ? `Bearer ${tokens.access_token}` : '',
          },
        })

        if (!response.ok) {
          throw new Error(`Userinfo request failed: ${response.statusText}`)
        }

        const data = await response.text()
        // User info returns a JWT token instead of a JSON object, we decode it
        return jwt.decode(data) as ProConnectProfile
      },
    },
    profile: ({ email, sub, given_name, usual_name }) => ({
      id: sub,
      role: 'USER',
      sub: sub,
      firstname: given_name,
      lastname: usual_name,
      email: email.toLowerCase(),
      provider: proConnectProviderId,
    }),
  }) satisfies OAuthConfig<ProConnectProfile>
