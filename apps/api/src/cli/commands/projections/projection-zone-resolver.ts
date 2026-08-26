/**
 * Rattachement des zones du fichier de projections détaillées Omphale au référentiel Otelo.
 *
 * Le fichier BH désigne ses zones par un code technique (`R11_01_23`) qu'aucune table Otelo ne
 * porte : `bassin` a pour clé primaire son libellé. Le raccord passe donc par la table de passage
 * INSEE (`BH_INSEE` → `LIB_BH`), dont les libellés sont antérieurs à la migration
 * `20260823120000_rename_bassins_aout_2026` et doivent lui être repassés.
 *
 * Trois écarts de forme séparent `LIB_BH` de `bassin.name` :
 *   1. 49 bassins ont été renommés par cette migration (BASSIN_RENAMES ci-dessous, extrait tel quel
 *      de son CTE `renommage`) ;
 *   2. certains libellés sont stockés dans la forme héritée « Bassin d'habitat de <X> », où <X> est
 *      le libellé du référentiel amputé de son préfixe technique `QZE `/`ZO ` ;
 *   3. deux bassins utilisent un tiret demi-cadratin (U+2013) là où le référentiel utilise un trait
 *      d'union ordinaire — écart invisible à l'œil, fatal sur une clé primaire.
 *
 * Ces trois normalisations résolvent 334 des 347 zones BH, de façon bijective. Les 13 restantes
 * sont traitées à part : 12 EPT du Grand Paris (GRAND_PARIS_EPT) et la zone résiduelle
 * `ZZZZZZZZZ`.
 */

/** Libellé antérieur → libellé actuel, extrait du CTE `renommage` de la migration d'août 2026. */
const BASSIN_RENAMES = new Map<string, string>([
  ['AXE LCT', 'AGOUT'],
  ['Arc Quercy', 'ARC QUERCY'],
  ['Bas Ségala - Monts de Lacaune', 'BAS SÉGALA - MONTS DE LACAUNE'],
  ['Bourges Boischaut Cher', 'BOURGES BOISCHAUT CHER'],
  ['CENTRE', 'CENTRE VENDÉE'],
  ['Chateauroux Boischaut Sud', 'CHATEAUROUX BOISCHAUT SUD'],
  ['Chinon Sud Tourraine', 'CHINON SUD TOURRAINE'],
  ['LITTORAL SUD (OCCITANIE)', 'CÔTE VERMEILLE - VALLESPIR'],
  ['LITTORAL SUD (PAYS DE LA LOIRE)', 'OLONNE - GRAND LITTORAL'],
  ['NORD-OUEST LITTORAL', 'NORD-OUEST LITTORAL VENDÉEN'],
  ['Orb - Espinousse', 'ORB - ESPINOUSSE'],
  ['PAYS DE DREUX + FORÊTS DU PERCHE', 'DREUX - PERCHE'],
  ['PAYS DE VALENÇAY BAZELLE ISSOUDUN', 'NORD INDRE'],
  ['PAYS D’ANCENIS ET CHÂTEAUBRIANT-DERVAL', 'ANCENIS - CHÂTEAUBRIANT'],
  ['PETR CENTRE-CHER HORS CA BOURGES PLUS', 'PETR CENTRE CHER'],
  ['PETR FIGEAC QUERCY VALLÉE DE LA DORDOGNE', 'PETR GRAND FIGEAC - QUERCY'],
  ['PLAINE LITTORALE', "PAYS DE L'OR - LUNEL"],
  ['Paris Métropole', 'PARIS MÉTROPOLE'],
  ['Piedmont Cevennol - Lingas', 'PIEDMONT CEVENNOL - LINGAS'],
  ['PÉRIURBAIN ÉTENDU', 'CENTRE ARIÈGE'],
  ['QZE ARLES', 'ARLES'],
  ['QZE AVIGNON', 'AVIGNON'],
  ['QZE CANNES-ANTIBE', 'CANNES - ANTIBES'],
  ['QZE CAVAILLON-APT', 'CAVAILLON - APT'],
  ['QZE DIGNE LES BAINS', 'DIGNE-LES-BAINS'],
  ['QZE DRAGUIGNAN', 'DRAGUIGNAN'],
  ['QZE MANOSQUE', 'MANOSQUE'],
  ['QZE MARSEILLE AUBAGNE', 'MARSEILLE - AUBAGNE'],
  ['QZE NICE', 'NICE'],
  ['QZE ORANGE', 'ORANGE'],
  ['SCOTS NORD-EST', 'NORD-EST BERRICHON'],
  ['Sologne Romorantinaise', 'SOLOGNE ROMORANTINAISE'],
  ['TERRITOIRE DE LA FORÊT, DES LOGES ET DE LA SOLOGNE', 'FORÊT D’ORLÉANS - SOLOGNE'],
  ['TERRITOIRE DU VAL DE SULLY, DU GIENNOIS ET DU BERRY LOIRE PUISAYE', 'EST LOIRET'],
  ['TERRITOIRES DU GRAND VENDÔMOIS + CC BEAUCE VAL DE LOIRE', 'GRAND VENDÔMOIS'],
  ['VITRY-LE-FRANÇOIS - SAINT-DIZIER', 'SAINT-DIZIER'],
  ['ZO DE LA BRENNE', 'BRENNE'],
  ['ZO DES PAYS CHARTAIN, DE COMBRAY ET COURVILOIS', 'GRAND CHARTRES'],
  ['ZO DU PERCHE', 'PERCHE'],
  ['ZO01', 'CERGY - VEXIN'],
  ['ZO02', 'SAINT-GERMAIN - SEINE AVAL'],
  ['ZO03', 'VERSAILLES - RAMBOUILLET'],
  ['ZO04', 'PARIS-SACLAY - HUREPOIX'],
  ['ZO05', 'ESSONNE EST'],
  ['ZO06', 'FONTAINEBLEAU - MELUN'],
  ['ZO07', 'BRIE - PROVINOIS - YERRES'],
  ['ZO08', 'MARNE-LA-VALLÉE - BRIE'],
  ['ZO09', 'MEAUX - COULOMMIERS'],
  ['ZO10', 'ROISSY - PLAINE DE FRANCE'],
])

/**
 * Les 12 EPT de la Métropole du Grand Paris.
 *
 * Le fichier de projections découpe la MGP en 12 territoires, absents de la table de passage 2025
 * (qui les référence sous des pseudo-codes `200054781_T*` sans `BH_INSEE`). Otelo connaît ces 12
 * territoires : ils existent dans `epcis` sous ces mêmes pseudo-codes, tous rattachés au bassin
 * « PARIS MÉTROPOLE ». Chaque zone reçoit donc son EPCI *et* ce bassin.
 *
 * La partition est vérifiée : la somme des 12 zones vaut 7 075 048 habitants en 2018, soit
 * exactement la population de la métropole.
 *
 * ⚠ `R11_BCN_23` et `R11_GOSB_23` ne sont pas projetés (`ind_robust = 0`, année 2018 seule).
 * Agréger les 12 EPT au-delà de 2018 amputerait la métropole de 16 % de sa population — c'est
 * `ProjectionZoneMillesime.isRobust` qui porte cette information jusqu'à l'API.
 */
const GRAND_PARIS_EPT = new Map<string, string>([
  ['Paris_23', '200054781_T1'],
  ['R_11_VSGP_23', '200054781_T2'],
  ['R11_GPSOuest_23', '200054781_T3'],
  ['R11_POLD_23', '200054781_T4'],
  ['R11_BCN_23', '200054781_T5'],
  ['R11_PC_23', '200054781_T6'],
  ['R11_PTE_23', '200054781_T7'],
  ['R11_EE_23', '200054781_T8'],
  ['R11_GPGE_23', '200054781_T9'],
  ['R11_PEMB_23', '200054781_T10'],
  ['R11_GPSEA_23', '200054781_T11'],
  ['R11_GOSB_23', '200054781_T12'],
])

export const GRAND_PARIS_BASSIN = 'PARIS MÉTROPOLE'

/** Zone résiduelle du fichier BH (6 277 habitants), sans contrepartie géographique. */
export const RESIDUAL_ZONE_CODE = 'ZZZZZZZZZ'

export type ProjectionZoneLevelName = 'EPCI' | 'BH'

export type ResolvedProjectionZone = {
  code: string
  level: ProjectionZoneLevelName
  label: string
  epciCode: string | null
  bassinName: string | null
}

/** Entrée de la table de passage INSEE, telle que lue depuis le classeur. */
export type PassageEntry = {
  /** Colonne `BH_INSEE`. */
  bhInsee: string
  /** Colonne `LIB_BH`. */
  libBh: string
}

/**
 * Ramène un libellé de bassin à sa forme comparable : espaces insécables en espaces ordinaires,
 * tiret demi-cadratin en trait d'union, bords élagués.
 */
export function normalizeBassinLabel(label: string): string {
  return label
    .replace(/\u00a0/g, ' ')
    .replace(/\u2013/g, '-')
    .trim()
}

/**
 * Ramène un code `BH_INSEE` à la forme utilisée par le fichier de projections.
 * La table de passage orthographie un code avec une barre oblique (`R28/24_09_23`) là où le
 * fichier utilise un tiret bas.
 */
export function normalizeBhCode(code: string): string {
  return code.trim().replace(/\//g, '_')
}

/**
 * Résout un libellé de la table de passage vers un `bassin.name` existant.
 * Renvoie `null` si aucune des trois formes connues ne correspond.
 */
export function resolveBassinName(libBh: string, knownBassinNames: Iterable<string>): string | null {
  const byNormalized = new Map<string, string>()
  for (const name of knownBassinNames) {
    byNormalized.set(normalizeBassinLabel(name), name)
  }
  return resolveAgainstIndex(libBh, byNormalized)
}

function resolveAgainstIndex(libBh: string, byNormalized: Map<string, string>): string | null {
  const label = normalizeBassinLabel(libBh)

  const direct = byNormalized.get(normalizeBassinLabel(BASSIN_RENAMES.get(label) ?? label))
  if (direct) return direct

  const asIs = byNormalized.get(label)
  if (asIs) return asIs

  // Forme héritée « Bassin d'habitat de <X> » : <X> est le libellé du référentiel privé de son
  // préfixe technique, il faut donc réessayer les deux préfixes avant de retomber sur <X> nu.
  const legacy = /^Bassin d'habitat de (.+)$/.exec(label)
  if (legacy) {
    const base = legacy[1]
    for (const prefix of ['QZE ', 'ZO ']) {
      const renamed = BASSIN_RENAMES.get(prefix + base)
      if (renamed) {
        const match = byNormalized.get(normalizeBassinLabel(renamed))
        if (match) return match
      }
    }
    const bare = byNormalized.get(normalizeBassinLabel(base))
    if (bare) return bare
  }

  return null
}

/**
 * Construit le référentiel des zones d'un fichier de projections.
 *
 * `zoneCodes` est l'ensemble des valeurs de la colonne ZONE du fichier. Pour le niveau EPCI, le
 * code *est* le code EPCI et doit exister dans `epcis` ; pour le niveau BH, le rattachement passe
 * par la table de passage, les EPT du Grand Paris ou reste vide.
 */
export function resolveProjectionZones(params: {
  level: ProjectionZoneLevelName
  zoneCodes: Iterable<string>
  /** `epcis` connus : code → libellé. */
  epcis: Map<string, string>
  /** `bassin.name` connus. */
  bassinNames: Iterable<string>
  /** Table de passage INSEE — inutile au niveau EPCI. */
  passage?: Iterable<PassageEntry>
}): { zones: ResolvedProjectionZone[]; unknownEpciCodes: string[]; unresolvedBhCodes: string[] } {
  const { level, zoneCodes, epcis } = params

  if (level === 'EPCI') {
    const zones: ResolvedProjectionZone[] = []
    const unknownEpciCodes: string[] = []
    for (const code of zoneCodes) {
      const label = epcis.get(code)
      if (label === undefined) {
        unknownEpciCodes.push(code)
        continue
      }
      zones.push({ code, level, label, epciCode: code, bassinName: null })
    }
    return { zones, unknownEpciCodes, unresolvedBhCodes: [] }
  }

  const byNormalized = new Map<string, string>()
  for (const name of params.bassinNames) {
    byNormalized.set(normalizeBassinLabel(name), name)
  }

  const libByCode = new Map<string, string>()
  for (const entry of params.passage ?? []) {
    libByCode.set(normalizeBhCode(entry.bhInsee), normalizeBassinLabel(entry.libBh))
  }

  const zones: ResolvedProjectionZone[] = []
  const unresolvedBhCodes: string[] = []

  for (const code of zoneCodes) {
    const eptEpciCode = GRAND_PARIS_EPT.get(code)
    if (eptEpciCode !== undefined) {
      zones.push({
        code,
        level,
        label: epcis.get(eptEpciCode) ?? eptEpciCode,
        epciCode: eptEpciCode,
        bassinName: GRAND_PARIS_BASSIN,
      })
      continue
    }

    if (code === RESIDUAL_ZONE_CODE) {
      zones.push({ code, level, label: 'Zone résiduelle', epciCode: null, bassinName: null })
      continue
    }

    const libBh = libByCode.get(normalizeBhCode(code))
    const bassinName = libBh === undefined ? null : resolveAgainstIndex(libBh, byNormalized)
    if (bassinName === null) {
      unresolvedBhCodes.push(code)
    }
    zones.push({ code, level, label: bassinName ?? libBh ?? code, epciCode: null, bassinName })
  }

  return { zones, unknownEpciCodes: [], unresolvedBhCodes }
}
