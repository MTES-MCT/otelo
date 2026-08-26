import { isMeasureHeader, parseMeasureHeader, UnknownMeasureHeaderError } from './projection-column-parser'

describe('parseMeasureHeader', () => {
  it('mappe les 9 scénarios sur la convention de colonnes du schéma', () => {
    const columns = [
      ['POP_pop_basse_MC_BAS', 'pb_b'],
      ['POP_pop_basse_MC_CENTRAL', 'pb_c'],
      ['POP_pop_basse_MC_HAUT', 'pb_h'],
      ['POP_central_MC_BAS', 'central_b'],
      ['POP_central_MC_CENTRAL', 'central_c'],
      ['POP_central_MC_HAUT', 'central_h'],
      ['POP_pop_haute_MC_BAS', 'ph_b'],
      ['POP_pop_haute_MC_CENTRAL', 'ph_c'],
      ['POP_pop_haute_MC_HAUT', 'ph_h'],
    ]

    for (const [header, column] of columns) {
      expect(parseMeasureHeader(header)).toEqual({ column, dimensionValue: null })
    }
  })

  it('traduit le suffixe de sexe de la source en libellé stocké en base', () => {
    expect(parseMeasureHeader('POP_central_MC_CENTRAL_1')).toEqual({
      column: 'central_c',
      dimensionValue: 'HOMME',
    })
    expect(parseMeasureHeader('POP_pop_haute_MC_BAS_2')).toEqual({
      column: 'ph_b',
      dimensionValue: 'FEMME',
    })
  })

  it('reconnaît les typologies de ménages, y compris celle qui contient un underscore et un +', () => {
    // `MENAGE_COMPLEXE_3+` est le cas qui invalide un découpage naïf sur les underscores :
    // un split('_') en ferait la modalité « 3+ » précédée de deux jetons parasites.
    expect(parseMeasureHeader('NBMEN_central_MC_BAS_MENAGE_COMPLEXE_3+')).toEqual({
      column: 'central_b',
      dimensionValue: 'MENAGE_COMPLEXE_3+',
    })
    expect(parseMeasureHeader('NBMEN_pop_basse_MC_HAUT_FAMILLE_MONOPARENTALE')).toEqual({
      column: 'pb_h',
      dimensionValue: 'FAMILLE_MONOPARENTALE',
    })
    expect(parseMeasureHeader('NBMEN_pop_haute_MC_CENTRAL_PERSONNE_SEULE')).toEqual({
      column: 'ph_c',
      dimensionValue: 'PERSONNE_SEULE',
    })
  })

  it('conserve les modalités toujours nulles de la source', () => {
    // ENFANT et HORS_MENAGE valent 0 partout dans les deux classeurs ; l'import les charge quand
    // même, c'est le rapport de fin d'import qui les signale.
    expect(parseMeasureHeader('NBMEN_central_MC_CENTRAL_ENFANT').dimensionValue).toBe('ENFANT')
    expect(parseMeasureHeader('NBMEN_central_MC_CENTRAL_HORS_MENAGE').dimensionValue).toBe('HORS_MENAGE')
  })

  it('ignore les espaces de bord', () => {
    expect(parseMeasureHeader('  POP_central_MC_BAS  ').column).toBe('central_b')
  })

  it('lève sur une forme inconnue plutôt que d’ignorer la colonne', () => {
    expect(() => parseMeasureHeader('ANNEE')).toThrow(UnknownMeasureHeaderError)
    expect(() => parseMeasureHeader('ind_robust')).toThrow(UnknownMeasureHeaderError)
    expect(() => parseMeasureHeader('POP_central_MC_MOYEN')).toThrow(UnknownMeasureHeaderError)
  })

  it('lève sur une modalité inconnue', () => {
    expect(() => parseMeasureHeader('NBMEN_central_MC_BAS_COLOCATION')).toThrow(/modalité inconnue/)
  })
})

describe('isMeasureHeader', () => {
  it('distingue les colonnes de mesure des colonnes de clé', () => {
    expect(isMeasureHeader('POP_central_MC_BAS')).toBe(true)
    expect(isMeasureHeader('NBMEN_central_MC_BAS_COUPLE')).toBe(true)
    expect(isMeasureHeader('ANNEE')).toBe(false)
    expect(isMeasureHeader('ZONE')).toBe(false)
    expect(isMeasureHeader('AGE')).toBe(false)
    expect(isMeasureHeader('AGE_GROUPE')).toBe(false)
    expect(isMeasureHeader('ind_robust')).toBe(false)
  })
})
