const initialValue = process.env.TRUSTED_PROXY_IPS

/**
 * La liste est lue au chargement du module : chaque cas doit donc réinitialiser le
 * cache de modules avant de la relire.
 */
const loadModule = (value: string) => {
  jest.resetModules()
  process.env.TRUSTED_PROXY_IPS = value

  return require('./trusted-proxies')
}

/**
 * Le fichier déclare lui-même les intermédiaires sur lesquels il raisonne, plutôt que
 * de reprendre ceux de `jest-setup.ts`.
 *
 * Les cas ci-dessous nomment des adresses en clair — `192.0.2.10` est un
 * intermédiaire connu, `88.120.4.7` un visiteur — et cette correspondance n'a de sens
 * que si la liste chargée est celle-ci. La reprendre de l'environnement global ferait
 * dépendre une vingtaine d'assertions d'une valeur écrite ailleurs, pour d'autres
 * suites : en la changer ferait tomber ce fichier sans que rien ne dise pourquoi.
 *
 * Les intermédiaires sont pris dans `192.0.2.0/24`, la plage réservée à la
 * documentation (RFC 5737) : les adresses de sortie réelles de la plateforme
 * d'hébergement n'ont pas à figurer dans le dépôt, et le comportement testé ne dépend
 * pas de leur valeur.
 */
const { invalidTrustedProxies, resolveClientIp, resolveThrottlerTracker, TRUSTED_PROXIES } = loadModule('192.0.2.10,192.0.2.11')

describe('TRUSTED_PROXIES', () => {
  afterAll(() => {
    if (initialValue === undefined) {
      delete process.env.TRUSTED_PROXY_IPS
    } else {
      process.env.TRUSTED_PROXY_IPS = initialValue
    }
  })

  it('should read the environment variable when it is set', () => {
    expect(loadModule('10.0.0.1, 192.168.1.1').TRUSTED_PROXIES).toEqual(['10.0.0.1', '192.168.1.1'])
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
    expect(loadModule('192.0.2.1O/32,10.0.0.1/64').invalidTrustedProxies()).toEqual(['192.0.2.1O/32', '10.0.0.1/64'])
  })

  /**
   * Les adresses de sortie sont des IPv4 fixes : une plage n'aurait pas de sens ici, et
   * la laisser passer comme une adresse exacte ferait taire une entrée qui ne protège
   * personne. Elle doit donc être signalée, au même titre qu'une adresse malformée.
   */
  it('should report a network range as unreadable', () => {
    expect(loadModule('10.0.0.0/24').invalidTrustedProxies()).toEqual(['10.0.0.0/24'])
  })

  /**
   * `.env.example` a publié les adresses suffixées `/32`, elles sont donc renseignées
   * telles quelles sur les environnements déployés. Les refuser viderait la liste au
   * redémarrage suivant, et tous les visiteurs partageraient alors le compteur de
   * l'intermédiaire, sans le moindre signal.
   */
  it('should still accept the published /32 suffix', () => {
    const { invalidTrustedProxies, resolveClientIp } = loadModule('192.0.2.10/32')

    expect(invalidTrustedProxies()).toEqual([])
    expect(resolveClientIp('88.120.4.7, 192.0.2.10')).toBe('88.120.4.7')
  })
})

describe('resolveClientIp', () => {
  it('should return the visitor address behind one trusted hop', () => {
    expect(resolveClientIp('88.120.4.7, 192.0.2.10')).toBe('88.120.4.7')
    expect(resolveClientIp('88.120.4.7, 192.0.2.11')).toBe('88.120.4.7')
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
    expect(resolveClientIp('1.2.3.4, 192.0.2.10, 88.120.4.7')).toBe('88.120.4.7')
  })

  it('should ignore a trusted address placed mid-chain by a caller', () => {
    expect(resolveClientIp('1.2.3.4, 192.0.2.10, 88.120.4.7, 192.0.2.11')).toBe('88.120.4.7')
  })

  // Fenêtre de déploiement, ou adresses de sortie périmées : à rendre bruyant, pas à deviner.
  it('should return null when the whole chain is trusted', () => {
    expect(resolveClientIp('192.0.2.10')).toBeNull()
    expect(resolveClientIp('192.0.2.10, 192.0.2.11')).toBeNull()
  })

  it('should unwrap IPv4-mapped addresses so a visitor keeps one bucket', () => {
    expect(resolveClientIp('::ffff:88.120.4.7, 192.0.2.10')).toBe('88.120.4.7')
    expect(resolveClientIp('88.120.4.7, ::ffff:192.0.2.10')).toBe('88.120.4.7')
  })

  it('should keep a genuine IPv6 visitor address', () => {
    expect(resolveClientIp('2001:db8::1, 192.0.2.10')).toBe('2001:db8::1')
  })

  it('should accept the array form produced by a repeated header', () => {
    expect(resolveClientIp(['1.2.3.4', '88.120.4.7, 192.0.2.10'])).toBe('88.120.4.7')
  })

  it('should return null on missing or unreadable input', () => {
    expect(resolveClientIp(undefined)).toBeNull()
    expect(resolveClientIp(null)).toBeNull()
    expect(resolveClientIp('')).toBeNull()
    expect(resolveClientIp('pas-une-adresse, 192.0.2.10')).toBeNull()
    expect(resolveClientIp('999.1.1.1, 192.0.2.10')).toBeNull()
  })
})

describe('resolveThrottlerTracker', () => {
  it('should count on the visitor address', () => {
    expect(resolveThrottlerTracker({ headers: { 'x-forwarded-for': '88.120.4.7, 192.0.2.10' }, ip: '10.0.0.1' })).toBe('88.120.4.7')
  })

  // Repli plutôt que blocage : une anomalie de configuration ne doit pas fermer l'API.
  it('should fall back to the express address when the chain is unusable', () => {
    expect(resolveThrottlerTracker({ headers: { 'x-forwarded-for': '192.0.2.10' }, ip: '10.0.0.1' })).toBe('10.0.0.1')
    expect(resolveThrottlerTracker({ headers: {}, ip: '10.0.0.1' })).toBe('10.0.0.1')
  })

  it('should never return undefined', () => {
    expect(resolveThrottlerTracker({ headers: {} })).toBe('unknown')
  })
})
