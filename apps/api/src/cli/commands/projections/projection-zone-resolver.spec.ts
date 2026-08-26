import {
  GRAND_PARIS_BASSIN,
  normalizeBassinLabel,
  normalizeBhCode,
  RESIDUAL_ZONE_CODE,
  resolveBassinName,
  resolveProjectionZones,
} from './projection-zone-resolver'

describe('normalizeBassinLabel', () => {
  it('ramène espace insécable, tiret demi-cadratin et espaces de bord à leur forme ordinaire', () => {
    expect(normalizeBassinLabel('  AMBOISE - BLÉRÉ – CHÂTEAU-RENAULT ')).toBe('AMBOISE - BLÉRÉ - CHÂTEAU-RENAULT')
    expect(normalizeBassinLabel('PAYS DE DREUX')).toBe('PAYS DE DREUX')
  })

  it("conserve l'apostrophe typographique, que le référentiel utilise", () => {
    expect(normalizeBassinLabel('VALLÉE DE L’AUDE - CABARDÈS')).toBe('VALLÉE DE L’AUDE - CABARDÈS')
  })
})

describe('normalizeBhCode', () => {
  it('aligne la barre oblique de la table de passage sur le tiret bas du fichier', () => {
    expect(normalizeBhCode('R28/24_09_23')).toBe('R28_24_09_23')
    expect(normalizeBhCode('R11_01_23')).toBe('R11_01_23')
  })
})

describe('resolveBassinName', () => {
  it('applique un renommage de la migration d’août 2026', () => {
    expect(resolveBassinName('ZO01', ['CERGY - VEXIN'])).toBe('CERGY - VEXIN')
    expect(resolveBassinName('AXE LCT', ['AGOUT'])).toBe('AGOUT')
  })

  it('accepte un libellé déjà à jour', () => {
    expect(resolveBassinName('ABBEVILLE', ['ABBEVILLE'])).toBe('ABBEVILLE')
  })

  it('dénoue la forme héritée « Bassin d’habitat de <X> » et son préfixe technique', () => {
    // La table de passage stocke « QZE NICE » sous la forme « Bassin d'habitat de NICE » : il faut
    // remettre le préfixe pour retrouver le renommage, avant de retomber sur le libellé nu.
    expect(resolveBassinName("Bassin d'habitat de NICE", ['NICE'])).toBe('NICE')
    expect(resolveBassinName("Bassin d'habitat de DU PERCHE", ['PERCHE'])).toBe('PERCHE')
    expect(resolveBassinName("Bassin d'habitat de DE LA BRENNE", ['BRENNE'])).toBe('BRENNE')
    expect(resolveBassinName("Bassin d'habitat de MARSEILLE AUBAGNE", ['MARSEILLE - AUBAGNE'])).toBe('MARSEILLE - AUBAGNE')
  })

  it('rapproche deux libellés que seul le type de tiret sépare', () => {
    expect(resolveBassinName('VALLÉE DE L’AUDE – CABARDÈS', ['VALLÉE DE L’AUDE - CABARDÈS'])).toBe('VALLÉE DE L’AUDE - CABARDÈS')
  })

  it('renvoie null quand aucune forme ne correspond', () => {
    expect(resolveBassinName('BASSIN INCONNU', ['ABBEVILLE'])).toBeNull()
  })
})

describe('resolveProjectionZones — niveau EPCI', () => {
  const epcis = new Map([
    ['200006682', 'CA Beaune, Côte et Sud'],
    ['200073260', 'CC du Val de Drôme'],
  ])

  it('rattache chaque zone à son EPCI et reprend son libellé', () => {
    const { zones, unknownEpciCodes } = resolveProjectionZones({
      level: 'EPCI',
      zoneCodes: ['200006682'],
      epcis,
      bassinNames: [],
    })

    expect(unknownEpciCodes).toEqual([])
    expect(zones).toEqual([
      {
        code: '200006682',
        level: 'EPCI',
        label: 'CA Beaune, Côte et Sud',
        epciCode: '200006682',
        bassinName: null,
      },
    ])
  })

  it('signale les codes absents de la table epcis au lieu de les charger', () => {
    const { zones, unknownEpciCodes } = resolveProjectionZones({
      level: 'EPCI',
      zoneCodes: ['200006682', '999999999'],
      epcis,
      bassinNames: [],
    })

    expect(unknownEpciCodes).toEqual(['999999999'])
    expect(zones).toHaveLength(1)
  })
})

describe('resolveProjectionZones — niveau bassin', () => {
  const epcis = new Map([
    ['200054781_T1', 'T1 – Ville de Paris'],
    ['200054781_T12', 'T12 – Grand-Orly Seine Bièvre (GOSB)'],
  ])
  const bassinNames = ['CERGY - VEXIN', 'PERCHE', GRAND_PARIS_BASSIN]
  const passage = [
    { bhInsee: 'R11_01_23', libBh: 'ZO01' },
    { bhInsee: 'R28/24_09_23', libBh: "Bassin d'habitat de DU PERCHE" },
  ]

  it('résout un bassin via la table de passage', () => {
    const { zones, unresolvedBhCodes } = resolveProjectionZones({
      level: 'BH',
      zoneCodes: ['R11_01_23'],
      epcis,
      bassinNames,
      passage,
    })

    expect(unresolvedBhCodes).toEqual([])
    expect(zones[0]).toEqual({
      code: 'R11_01_23',
      level: 'BH',
      label: 'CERGY - VEXIN',
      epciCode: null,
      bassinName: 'CERGY - VEXIN',
    })
  })

  it('retrouve PERCHE malgré la barre oblique de la table de passage', () => {
    const { zones } = resolveProjectionZones({
      level: 'BH',
      zoneCodes: ['R28_24_09_23'],
      epcis,
      bassinNames,
      passage,
    })

    expect(zones[0].bassinName).toBe('PERCHE')
  })

  it('rattache un EPT du Grand Paris à son pseudo-EPCI et au bassin de la métropole', () => {
    const { zones, unresolvedBhCodes } = resolveProjectionZones({
      level: 'BH',
      zoneCodes: ['Paris_23', 'R11_GOSB_23'],
      epcis,
      bassinNames,
      passage,
    })

    expect(unresolvedBhCodes).toEqual([])
    expect(zones).toEqual([
      {
        code: 'Paris_23',
        level: 'BH',
        label: 'T1 – Ville de Paris',
        epciCode: '200054781_T1',
        bassinName: GRAND_PARIS_BASSIN,
      },
      {
        code: 'R11_GOSB_23',
        level: 'BH',
        label: 'T12 – Grand-Orly Seine Bièvre (GOSB)',
        epciCode: '200054781_T12',
        bassinName: GRAND_PARIS_BASSIN,
      },
    ])
  })

  it('charge la zone résiduelle sans rattachement plutôt que de la perdre', () => {
    const { zones, unresolvedBhCodes } = resolveProjectionZones({
      level: 'BH',
      zoneCodes: [RESIDUAL_ZONE_CODE],
      epcis,
      bassinNames,
      passage,
    })

    expect(unresolvedBhCodes).toEqual([])
    expect(zones[0]).toEqual({
      code: RESIDUAL_ZONE_CODE,
      level: 'BH',
      label: 'Zone résiduelle',
      epciCode: null,
      bassinName: null,
    })
  })

  it('signale une zone que la table de passage ne connaît pas, sans interrompre les autres', () => {
    const { zones, unresolvedBhCodes } = resolveProjectionZones({
      level: 'BH',
      zoneCodes: ['R11_01_23', 'R99_99_23'],
      epcis,
      bassinNames,
      passage,
    })

    expect(unresolvedBhCodes).toEqual(['R99_99_23'])
    expect(zones).toHaveLength(2)
    expect(zones[1]).toMatchObject({ code: 'R99_99_23', bassinName: null, label: 'R99_99_23' })
  })
})
