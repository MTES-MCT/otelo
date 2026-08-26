import {
  ZProjectionByAgeQuery,
  ZProjectionByHouseholdTypeQuery,
  ZProjectionSeriesQuery,
  ZResolveProjectionZonesQuery,
} from '~/schemas/projections/projections'

describe('ZProjectionSeriesQuery', () => {
  it('découpe les codes de zone sur la virgule et élague les espaces', () => {
    const parsed = ZProjectionSeriesQuery.parse({ zoneCodes: ' 200006682 , R11_01_23 ,' })

    expect(parsed.zoneCodes).toEqual(['200006682', 'R11_01_23'])
  })

  it('couvre toute la période par défaut', () => {
    const parsed = ZProjectionSeriesQuery.parse({ zoneCodes: '200006682' })

    expect(parsed.fromYear).toBe(2018)
    expect(parsed.toYear).toBe(2050)
    expect(parsed.scenarios).toBeUndefined()
  })

  it('convertit les années transmises en chaîne', () => {
    const parsed = ZProjectionSeriesQuery.parse({ zoneCodes: '200006682', fromYear: '2030', toYear: '2040' })

    expect(parsed.fromYear).toBe(2030)
    expect(parsed.toYear).toBe(2040)
  })

  it('refuse une liste de zones vide ou trop longue', () => {
    expect(ZProjectionSeriesQuery.safeParse({ zoneCodes: '' }).success).toBe(false)
    expect(
      ZProjectionSeriesQuery.safeParse({
        zoneCodes: Array.from({ length: 51 }, (_, i) => `Z${i}`).join(','),
      }).success,
    ).toBe(false)
  })

  it('refuse un intervalle d’années inversé', () => {
    const result = ZProjectionSeriesQuery.safeParse({
      zoneCodes: '200006682',
      fromYear: 2040,
      toYear: 2030,
    })

    expect(result.success).toBe(false)
    expect(result.error?.issues[0].message).toContain('antérieure ou égale')
  })

  it('refuse une année hors de la période couverte par la source', () => {
    expect(ZProjectionSeriesQuery.safeParse({ zoneCodes: '200006682', fromYear: 2010 }).success).toBe(false)
    expect(ZProjectionSeriesQuery.safeParse({ zoneCodes: '200006682', toYear: 2070 }).success).toBe(false)
  })

  it('refuse un scénario inconnu', () => {
    expect(ZProjectionSeriesQuery.safeParse({ zoneCodes: '200006682', scenarios: 'centralX' }).success).toBe(false)
    expect(ZProjectionSeriesQuery.parse({ zoneCodes: '200006682', scenarios: 'centralC,pbH' }).scenarios).toEqual(['centralC', 'pbH'])
  })

  it('refuse un niveau inconnu', () => {
    expect(ZProjectionSeriesQuery.safeParse({ zoneCodes: '200006682', level: 'COMMUNE' }).success).toBe(false)
    expect(ZProjectionSeriesQuery.parse({ zoneCodes: '200006682', level: 'BH' }).level).toBe('BH')
  })
})

describe('ZProjectionByAgeQuery', () => {
  it('accepte une requête dont la volumétrie reste raisonnable', () => {
    // 1 zone x 33 ans x 100 âges x 2 sexes = 6 600 lignes.
    expect(ZProjectionByAgeQuery.safeParse({ zoneCodes: '200006682' }).success).toBe(true)
  })

  it('refuse une requête dont la réponse dépasserait le plafond', () => {
    // 50 zones x 33 ans x 100 âges x 2 sexes = 330 000 lignes.
    const result = ZProjectionByAgeQuery.safeParse({
      zoneCodes: Array.from({ length: 50 }, (_, i) => `Z${i}`).join(','),
    })

    expect(result.success).toBe(false)
    expect(result.error?.issues[0].message).toContain('Requête trop large')
    expect(result.error?.issues[0].message).toContain('Resserrer')
  })

  it('laisse resserrer par âge, par sexe ou par année', () => {
    const zones = Array.from({ length: 50 }, (_, i) => `Z${i}`).join(',')

    // 50 × 33 × 3 × 2 = 9 900 lignes
    expect(ZProjectionByAgeQuery.safeParse({ zoneCodes: zones, ages: '0,50,99' }).success).toBe(true)
    // 50 × 3 × 100 × 2 = 30 000 lignes : encore trop
    expect(ZProjectionByAgeQuery.safeParse({ zoneCodes: zones, fromYear: 2048, toYear: 2050 }).success).toBe(false)
    // 50 × 3 × 100 × 1 = 15 000 lignes : le filtre sur le sexe suffit à repasser sous le plafond
    expect(ZProjectionByAgeQuery.safeParse({ zoneCodes: zones, fromYear: 2048, toYear: 2050, sex: 'FEMME' }).success).toBe(true)
  })

  it('refuse un âge hors des bornes de la source', () => {
    expect(ZProjectionByAgeQuery.safeParse({ zoneCodes: '200006682', ages: '100' }).success).toBe(false)
    expect(ZProjectionByAgeQuery.parse({ zoneCodes: '200006682', ages: '0,99' }).ages).toEqual([0, 99])
  })
})

describe('ZProjectionByHouseholdTypeQuery', () => {
  it('accepte les modalités nommées comme l’enum Prisma', () => {
    // La base stocke `MENAGE_COMPLEXE_3+`, mais un `+` dans une query string demanderait un
    // encodage : l'API expose le nom de l'enum.
    const parsed = ZProjectionByHouseholdTypeQuery.parse({
      zoneCodes: '200006682',
      householdTypes: 'COUPLE,MENAGE_COMPLEXE_3_PLUS',
    })

    expect(parsed.householdTypes).toEqual(['COUPLE', 'MENAGE_COMPLEXE_3_PLUS'])
  })

  it('refuse une modalité inconnue', () => {
    expect(ZProjectionByHouseholdTypeQuery.safeParse({ zoneCodes: '200006682', householdTypes: 'COLOCATION' }).success).toBe(false)
  })
})

describe('ZResolveProjectionZonesQuery', () => {
  it('découpe les codes EPCI', () => {
    expect(ZResolveProjectionZonesQuery.parse({ epciCodes: '200006682,200054781_T1' }).epciCodes).toEqual(['200006682', '200054781_T1'])
  })

  it('exige au moins un code', () => {
    expect(ZResolveProjectionZonesQuery.safeParse({ epciCodes: '' }).success).toBe(false)
  })
})
