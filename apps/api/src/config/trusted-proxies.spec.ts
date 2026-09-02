import { invalidTrustedProxies, resolveClientIp, resolveThrottlerTracker, TRUSTED_PROXIES } from './trusted-proxies'

/**
 * La liste est lue au chargement du module : chaque cas doit donc réinitialiser le
 * cache de modules avant de la relire.
 */
const loadModule = (value?: string) => {
  jest.resetModules()

  if (value === undefined) {
    delete process.env.TRUSTED_PROXY_IPS
  } else {
    process.env.TRUSTED_PROXY_IPS = value
  }

  return require('./trusted-proxies')
}

describe('TRUSTED_PROXIES', () => {
  const initialValue = process.env.TRUSTED_PROXY_IPS

  afterAll(() => {
    if (initialValue === undefined) {
      delete process.env.TRUSTED_PROXY_IPS
    } else {
      process.env.TRUSTED_PROXY_IPS = initialValue
    }
  })

  it('should fall back to the hosting platform egress addresses', () => {
    expect(loadModule().TRUSTED_PROXIES).toEqual(['171.33.105.206/32', '171.33.92.211/32'])
  })

  it('should read the environment variable when it is set', () => {
    expect(loadModule('10.0.0.0/24, 192.168.1.1').TRUSTED_PROXIES).toEqual(['10.0.0.0/24', '192.168.1.1'])
  })

  /**
   * Une liste dont toutes les entrées sont invalides ferait silencieusement retomber
   * better-auth sur son comportement strict, tout en paraissant configurée.
   */
  it('should never produce empty entries', () => {
    expect(loadModule('10.0.0.1,,10.0.0.2,').TRUSTED_PROXIES).toEqual(['10.0.0.1', '10.0.0.2'])
    expect(loadModule('').TRUSTED_PROXIES).toEqual([])
  })

  it('should only declare entries both rate limiters can read', () => {
    expect(invalidTrustedProxies()).toEqual([])
    expect(TRUSTED_PROXIES.length).toBeGreaterThan(0)
  })

  it('should report malformed entries', () => {
    expect(loadModule('171.33.105.2O6/32,10.0.0.1/64').invalidTrustedProxies()).toEqual(['171.33.105.2O6/32', '10.0.0.1/64'])
  })
})

describe('resolveClientIp', () => {
  it('should return the visitor address behind one trusted hop', () => {
    expect(resolveClientIp('88.120.4.7, 171.33.105.206')).toBe('88.120.4.7')
    expect(resolveClientIp('88.120.4.7, 171.33.92.211')).toBe('88.120.4.7')
  })

  it('should return the address as-is when called directly', () => {
    expect(resolveClientIp('88.120.4.7')).toBe('88.120.4.7')
  })

  /**
   * Le cœur de la protection : la valeur de gauche est écrite par l'appelant, celle de
   * droite est ajoutée par le routeur. Retenir la gauche permettrait d'épuiser le
   * compteur d'un tiers en annonçant son adresse.
   */
  it('should ignore an address forged on the left of the chain', () => {
    expect(resolveClientIp('1.2.3.4, 88.120.4.7')).toBe('88.120.4.7')
    expect(resolveClientIp('1.2.3.4, 171.33.105.206, 88.120.4.7')).toBe('88.120.4.7')
  })

  it('should ignore a trusted address placed mid-chain by a caller', () => {
    expect(resolveClientIp('1.2.3.4, 171.33.105.206, 88.120.4.7, 171.33.92.211')).toBe('88.120.4.7')
  })

  // Fenêtre de déploiement, ou adresses de sortie périmées : à rendre bruyant, pas à deviner.
  it('should return null when the whole chain is trusted', () => {
    expect(resolveClientIp('171.33.105.206')).toBeNull()
    expect(resolveClientIp('171.33.105.206, 171.33.92.211')).toBeNull()
  })

  it('should unwrap IPv4-mapped addresses so a visitor keeps one bucket', () => {
    expect(resolveClientIp('::ffff:88.120.4.7, 171.33.105.206')).toBe('88.120.4.7')
    expect(resolveClientIp('88.120.4.7, ::ffff:171.33.105.206')).toBe('88.120.4.7')
  })

  it('should keep a genuine IPv6 visitor address', () => {
    expect(resolveClientIp('2001:db8::1, 171.33.105.206')).toBe('2001:db8::1')
  })

  it('should accept the array form produced by a repeated header', () => {
    expect(resolveClientIp(['1.2.3.4', '88.120.4.7, 171.33.105.206'])).toBe('88.120.4.7')
  })

  it('should return null on missing or unreadable input', () => {
    expect(resolveClientIp(undefined)).toBeNull()
    expect(resolveClientIp(null)).toBeNull()
    expect(resolveClientIp('')).toBeNull()
    expect(resolveClientIp('pas-une-adresse, 171.33.105.206')).toBeNull()
    expect(resolveClientIp('999.1.1.1, 171.33.105.206')).toBeNull()
  })
})

describe('resolveThrottlerTracker', () => {
  it('should count on the visitor address', () => {
    expect(resolveThrottlerTracker({ headers: { 'x-forwarded-for': '88.120.4.7, 171.33.105.206' }, ip: '10.0.0.1' })).toBe('88.120.4.7')
  })

  // Repli plutôt que blocage : une anomalie de configuration ne doit pas fermer l'API.
  it('should fall back to the express address when the chain is unusable', () => {
    expect(resolveThrottlerTracker({ headers: { 'x-forwarded-for': '171.33.105.206' }, ip: '10.0.0.1' })).toBe('10.0.0.1')
    expect(resolveThrottlerTracker({ headers: {}, ip: '10.0.0.1' })).toBe('10.0.0.1')
  })

  it('should never return undefined', () => {
    expect(resolveThrottlerTracker({ headers: {} })).toBe('unknown')
  })
})
