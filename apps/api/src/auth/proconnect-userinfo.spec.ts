import { createRemoteJWKSet, exportJWK, generateKeyPair, jwtVerify, SignJWT } from 'jose'

/**
 * Rejoue sur des jetons réellement signés la vérification que fait `getUserInfo`.
 *
 * Deux réglages y sont figés parce qu'ils paraissent faux : l'émetteur est
 * `https://<hôte>/api/v2` et non l'hôte seul, et la liste d'algorithmes est explicite —
 * ProConnect annonce aussi `HS256`.
 */
describe('Vérification du jeton userinfo ProConnect', () => {
  const ISSUER = 'https://fca.integ01.dev-agentconnect.fr/api/v2'
  const AUDIENCE = 'client-proconnect'
  const ALGORITHMS = ['ES256', 'RS256']

  let privateKey: CryptoKey
  let jwks: ReturnType<typeof createRemoteJWKSet>

  beforeAll(async () => {
    const pair = await generateKeyPair('ES256')
    privateKey = pair.privateKey
    const publicJwk = await exportJWK(pair.publicKey)
    publicJwk.alg = 'ES256'
    publicJwk.kid = 'test-key'

    // JWKS simulé par un fetch : on éprouve la vraie mécanique de `jose`.
    jest.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      status: 200,
      headers: new Headers({ 'content-type': 'application/json' }),
      json: async () => ({ keys: [publicJwk] }),
    } as Response)

    jwks = createRemoteJWKSet(new URL(`${ISSUER}/jwks`))
  })

  afterAll(() => jest.restoreAllMocks())

  const sign = async (claims: Record<string, unknown>, overrides: { issuer?: string; audience?: string; expiresIn?: string } = {}) =>
    new SignJWT(claims)
      .setProtectedHeader({ alg: 'ES256', kid: 'test-key' })
      .setIssuer(overrides.issuer ?? ISSUER)
      .setAudience(overrides.audience ?? AUDIENCE)
      .setIssuedAt()
      .setExpirationTime(overrides.expiresIn ?? '5m')
      .sign(privateKey)

  const verify = (jwt: string) => jwtVerify(jwt, jwks, { algorithms: ALGORITHMS, audience: AUDIENCE, issuer: ISSUER })

  it('should accept a token ProConnect actually signed', async () => {
    const jwt = await sign({ sub: 'agent-1', email: 'Agent@DDT71.gouv.fr', given_name: 'Agnès', usual_name: 'Martin' })

    const { payload } = await verify(jwt)

    expect(payload.sub).toBe('agent-1')
    expect((payload.email as string).toLowerCase()).toBe('agent@ddt71.gouv.fr')
  })

  it('should refuse a token signed by someone else', async () => {
    const { privateKey: attackerKey } = await generateKeyPair('ES256')
    const jwt = await new SignJWT({ sub: 'usurpateur' })
      .setProtectedHeader({ alg: 'ES256', kid: 'test-key' })
      .setIssuer(ISSUER)
      .setAudience(AUDIENCE)
      .setIssuedAt()
      .setExpirationTime('5m')
      .sign(attackerKey)

    await expect(verify(jwt)).rejects.toThrow()
  })

  it('should refuse a token whose payload was altered after signing', async () => {
    const jwt = await sign({ sub: 'agent-1', email: 'agent@ddt71.gouv.fr' })
    const [header, , signature] = jwt.split('.')
    const forged = Buffer.from(JSON.stringify({ sub: 'admin', email: 'admin@otelo.test' })).toString('base64url')

    await expect(verify(`${header}.${forged}.${signature}`)).rejects.toThrow()
  })

  it('should refuse an expired token', async () => {
    const jwt = await sign({ sub: 'agent-1' }, { expiresIn: '-1m' })

    await expect(verify(jwt)).rejects.toThrow()
  })

  it('should refuse a token meant for another audience', async () => {
    const jwt = await sign({ sub: 'agent-1' }, { audience: 'une-autre-application' })

    await expect(verify(jwt)).rejects.toThrow()
  })

  /** L'émetteur n'est pas l'hôte, mais l'hôte suivi de `/api/v2`. */
  it('should refuse a token issued by the host alone', async () => {
    const jwt = await sign({ sub: 'agent-1' }, { issuer: 'https://fca.integ01.dev-agentconnect.fr' })

    await expect(verify(jwt)).rejects.toThrow()
  })

  it('should refuse an unsigned token', async () => {
    const header = Buffer.from(JSON.stringify({ alg: 'none' })).toString('base64url')
    const payload = Buffer.from(JSON.stringify({ sub: 'admin', iss: ISSUER, aud: AUDIENCE })).toString('base64url')

    await expect(verify(`${header}.${payload}.`)).rejects.toThrow()
  })
})
