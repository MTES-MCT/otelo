import { DocurbaEpciResult, DocurbaService } from './docurba.service'

type CachePrivates = {
  epciCache: Map<string, { result: DocurbaEpciResult | null; cachedAt: number }>
  cacheResult: (epciCode: string, result: DocurbaEpciResult | null) => void
}

describe('DocurbaService', () => {
  let service: DocurbaService

  beforeEach(() => {
    // `onModuleInit` n'est pas appelé : le service se rabat sur `geo.api.gouv.fr`.
    service = new DocurbaService()
  })

  describe('appel à geo.api.gouv.fr', () => {
    let fetchSpy: jest.SpyInstance

    beforeEach(() => {
      fetchSpy = jest.spyOn(global, 'fetch').mockResolvedValue({
        ok: true,
        json: async () => [{ code: '71076' }],
      } as Response)
    })

    afterEach(() => fetchSpy.mockRestore())

    /** Sans encodage, un code contenant `?` ou `..` altère l'appel émis. */
    it('should encode the code it puts in the outgoing URL', async () => {
      await service.getForEpci('../../admin')

      const url = fetchSpy.mock.calls[0][0] as string
      expect(url).toContain(encodeURIComponent('../../admin'))
      expect(url).not.toContain('../../admin')
    })

    /** Le `Promise.race` libère la requête entrante, pas la sortante. */
    it('should give up on the outgoing call rather than leave it open', async () => {
      await service.getForEpci('200069672')

      const init = fetchSpy.mock.calls[0][1] as RequestInit
      expect(init.signal).toBeInstanceOf(AbortSignal)
    })
  })

  /** Éprouvée directement : passer par `getForEpci` imposerait 5 000 appels simulés. */
  describe('bornes du cache', () => {
    const fill = (count: number, prefix = 'code-') => {
      const privates = service as unknown as CachePrivates
      for (let i = 0; i < count; i++) privates.cacheResult(`${prefix}${i}`, null)
      return privates.epciCache
    }

    it('should never grow past its ceiling', () => {
      expect(fill(6000).size).toBe(5000)
    })

    it('should drop the oldest entry first', () => {
      const cache = fill(5001)

      expect(cache.has('code-0')).toBe(false)
      expect(cache.has('code-5000')).toBe(true)
    })

    it('should not evict anything when refreshing an entry it already holds', () => {
      const cache = fill(5000)
      ;(service as unknown as CachePrivates).cacheResult('code-0', null)

      expect(cache.size).toBe(5000)
      expect(cache.has('code-1')).toBe(true)
    })
  })
})
