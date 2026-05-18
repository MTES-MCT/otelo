export type SourceEntry = {
  source: string
  millesime: string
  etape: string
  etapeId: string
  description: string
  guideLink?: string
}

export const DATA_SOURCES: SourceEntry[] = [
  // --- Projections démographiques ---
  {
    source: 'INSEE Omphale et CGDD/SDES',
    millesime: '2022-2050',
    etape: 'Projections démographiques',
    etapeId: 'projections-demographiques',
    description:
      "La définition des hypothèses démographiques dans Otelo repose sur des scénarios de projection démographique en population établis par l'INSEE et sur la traduction de ces scénarios en projections en nombre de ménages, réalisée par le CGDD/SDES. Attention, ces projections peuvent être recalées à la marge, de manière à tenir compte des valeurs les plus récentes observées selon le recensement pour la population et le nombre de ménages du territoire étudié. De plus, pour certains territoires, ces projections INSEE/CGDD ne sont pas disponibles et dans ce cas l'équipe Otelo propose des projections construites à partir de projections INSEE/CGDD disponibles à une échelle supra (cf. guide d'utilisation). La précision est alors fournie à l'utilisateur.",
    guideLink: '/guide#elaboration-projections',
  },

  // --- Recalage des projections ---
  {
    source: 'Recensement INSEE',
    millesime: '2022',
    etape: 'Recalage des projections',
    etapeId: 'recalage-projections',
    description:
      'Recalage des projections en population et en ménages : les projections démographiques sont recalées pour qu\u2019elles soient toutes cohérentes avec la valeur observée du nombre de ménages selon les données du recensement les plus récentes.',
  },

  // --- Taux de vacance et de résidence secondaire ---
  {
    source: 'CGDD/SDES à partir des sources fiscales',
    millesime: '2022',
    etape: 'Taux de vacance et de résidence secondaire',
    etapeId: 'taux-vacance-residence-secondaire',
    description: 'Valeurs de référence des modes et statut du parc de logement : taux de résidences secondaires et de logements vacants.',
  },

  // --- Taux annuel de restructuration et de disparition ---
  {
    source: 'CGDD/SDES à partir des sources fiscales',
    millesime: '2022',
    etape: 'Taux annuel de restructuration et de disparition',
    etapeId: 'taux-restructuration-disparition',
    description:
      "Valeurs de référence du taux annuel d'apparition de logements par restructuration et du taux annuel de disparition, calculées sur la base d'une mesure de ces taux entre 2015 et 2022.",
  },

  // --- Distinction vacance longue durée / courte durée ---
  {
    source: 'Fichiers fonciers',
    millesime: '2024',
    etape: 'Distinction vacance longue durée / courte durée',
    etapeId: 'vacance-longue-courte',
    description:
      "Utilisation pour mesurer la part des logements vacants de longue durée (plus de 2 ans) et de courte durée (2 ans ou moins). La part de la vacance de longue durée observée dans les fichiers fonciers 2024 est appliquée au volume de logements vacants mesuré via la source d'origine fiscale CGDD/SDES.",
  },

  // --- Hors logement : sans abrisme et habitat de fortune ---
  {
    source: 'Recensement INSEE',
    millesime: '2022',
    etape: 'Hors logement : sans abrisme et habitat de fortune',
    etapeId: 'hors-logement',
    description: 'Estimation des personnes sans domicile ou en habitat de fortune.',
  },
  {
    source: 'Système National d\u2019Enregistrement (SNE)',
    millesime: '2023',
    etape: 'Hors logement : sans abrisme et habitat de fortune',
    etapeId: 'hors-logement',
    description:
      "Estimation des personnes sans-abri, logées à l'hôtel, en squat, en camping, à partir des motifs associés à la demande d'un logement social.",
  },

  // --- Hors logement : structures d'hébergement ---
  {
    source: 'Finess',
    millesime: '2022',
    etape: "Hors logement : structures d'hébergement",
    etapeId: 'structures-hebergement',
    description:
      "Identification des personnes accueillies dans une structure d'hébergement (détails sur les structures prises en compte, cf. guide d'utilisation).",
    guideLink: '/guide#hebergement-social',
  },

  // --- Hors logement : ménages hébergés ---
  {
    source: 'Système National d\u2019Enregistrement (SNE)',
    millesime: '2023',
    etape: 'Hébergés chez un tiers',
    etapeId: 'menages-heberges',
    description:
      'Identification des personnes hébergées chez un particulier et des personnes logées à titre gratuit, à partir des motifs associés à la demande d\u2019un logement social.',
  },

  // --- Mal-logement : cohabitation intergénérationnelle ---
  {
    source: 'CGDD/SDES à partir des sources fiscales',
    millesime: '2022',
    etape: 'Cohabitation intergénérationnelle présumée subie',
    etapeId: 'cohabitation-intergenerationnelle',
    description:
      "Estimer les cas de cohabitation subie des jeunes chez leurs parents. La cohabitation est identifiée à partir d'une différence d'âge de plus de 18 ans entre deux foyers fiscaux d'un même ménage, tandis que le caractère subi de cette cohabitation est estimé normativement à partir de l'âge (+ de 25 ans) et du niveau des ressources de chaque foyer fiscal (cf. guide d'utilisation).",
    guideLink: '/guide#cohabitation-intergenerationnelle',
  },

  // --- Mal-logement : dépense excessive ---
  {
    source: 'CNAF',
    millesime: '2022',
    etape: 'Dépense excessive pour le logement',
    etapeId: 'depense-excessive',
    description:
      "À partir des données des bénéficiaires d'APL dans le parc privé, estimation d'un volume de ménages dont la dépense en logements nette des aides au logement est supérieure à un seuil à définir, compris entre 20 et 40 %.",
  },

  // --- Mal-logement : mauvaise qualité ---
  {
    source: 'Recensement INSEE',
    millesime: '2022',
    etape: 'Résidences principales de mauvaise qualité',
    etapeId: 'mauvaise-qualite',
    description:
      'Estimation des ménages occupant un logement de mauvaise qualité dans le parc privé (\u00ab absence de sanitaire \u00bb ou \u00ab absence de sanitaire et chauffage \u00bb).',
  },
  {
    source: 'CGDD/SDES à partir des sources fiscales',
    millesime: '2022',
    etape: 'Résidences principales de mauvaise qualité',
    etapeId: 'mauvaise-qualite',
    description:
      'Identification d\u2019un parc de logements dit \u00ab potentiellement indigne \u00bb, dans le parc privé. Ce volume correspond aux résidences principales privées pour lesquelles le classement cadastral est égal à 7 ou 8 (les valeurs correspondant aux niveaux de gamme les plus faibles) et occupées par des ménages dont les revenus sont inférieurs à 70 % du seuil de pauvreté.',
  },
  {
    source: 'Fichiers fonciers',
    millesime: '2024',
    etape: 'Résidences principales de mauvaise qualité',
    etapeId: 'mauvaise-qualite',
    description:
      "Identification d'un parc de logements de mauvaise qualité du parc privé (absence de WC et/ou douche et/ou chauffage central).",
  },

  // --- Mal-logement : suroccupation ---
  {
    source: 'Recensement INSEE',
    millesime: '2022',
    etape: 'Résidences principales sur-occupées',
    etapeId: 'suroccupation',
    description: 'Estimation des ménages en situation de suroccupation (modérée ou accentuée) dans le parc privé.',
  },
  {
    source: 'CGDD/SDES à partir des sources fiscales',
    millesime: '2022',
    etape: 'Résidences principales sur-occupées',
    etapeId: 'suroccupation',
    description: 'Estimation des ménages en situation de suroccupation (lourde ou légère) dans le parc privé.',
  },

  // --- Prise en compte des doublons ---
  {
    source: 'ENL',
    millesime: '2013',
    etape: 'Prise en compte des doublons éventuels',
    etapeId: 'prise-en-compte-doublons',
    description:
      "Les données de l'Enquête Nationale Logement (ENL) 2013 sur les ménages logés dans le parc libre permettent d'identifier les situations de cumul de mal-logement possibles, en croisant les facteurs de besoin. Ces taux de double prise en compte sont appliqués au volume de personnes mal-logées.",
  },
]

export type SourceGroup = {
  source: string
  millesime: string
  entries: { etape: string; etapeId: string; description: string; guideLink?: string }[]
}

export type StepGroup = {
  etape: string
  etapeId: string
  entries: { source: string; millesime: string; description: string; guideLink?: string }[]
}

export function groupBySource(entries: SourceEntry[]): SourceGroup[] {
  const map = new Map<string, SourceGroup>()
  for (const e of entries) {
    const existing = map.get(e.source)
    if (existing) {
      existing.entries.push({ etape: e.etape, etapeId: e.etapeId, description: e.description, guideLink: e.guideLink })
    } else {
      map.set(e.source, {
        source: e.source,
        millesime: e.millesime,
        entries: [{ etape: e.etape, etapeId: e.etapeId, description: e.description, guideLink: e.guideLink }],
      })
    }
  }
  return Array.from(map.values())
}

export function groupByStep(entries: SourceEntry[]): StepGroup[] {
  const map = new Map<string, StepGroup>()
  for (const e of entries) {
    const key = e.etapeId
    const existing = map.get(key)
    if (existing) {
      existing.entries.push({ source: e.source, millesime: e.millesime, description: e.description, guideLink: e.guideLink })
    } else {
      map.set(key, {
        etape: e.etape,
        etapeId: e.etapeId,
        entries: [{ source: e.source, millesime: e.millesime, description: e.description, guideLink: e.guideLink }],
      })
    }
  }
  return Array.from(map.values())
}

export const UNIQUE_SOURCES = [...new Set(DATA_SOURCES.map((e) => e.source))]
export const UNIQUE_ETAPES = [...new Set(DATA_SOURCES.map((e) => e.etape))]
