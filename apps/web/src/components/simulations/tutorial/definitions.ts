/**
 * Définitions affichées derrière les boutons « ? » du parcours, à côté des libellés qu'elles
 * expliquent. Textes repris de la feuille « Définitions » du référentiel métier.
 */
export type Definition = {
  title: string
  description: string
}

export const BASSIN_HABITAT_DEFINITION: Definition = {
  title: "Le bassin d'habitat, l'échelle de référence",
  description:
    "Le bassin d'habitat est l'échelle de référence proposée par Otelo pour estimer les besoins en logements. Il regroupe plusieurs EPCI appartenant à un même espace de fonctionnement du marché du logement. Lorsque vous recherchez un EPCI, Otelo vous propose automatiquement le bassin d'habitat auquel il appartient. Vous pourrez ensuite paramétrer et consulter les résultats de chaque EPCI qui le compose.",
}

export const getMillesimeDefinition = (millesime?: string | null): Definition => ({
  title: "Le millésime : point de départ de l'estimation",
  description: millesime
    ? `Le millésime correspond à l'année de référence des données utilisées par Otelo. Il fixe donc le point de départ de votre scénario. Avec le millésime ${millesime}, votre estimation commence au 1er janvier ${millesime}.`
    : "Le millésime correspond à l'année de référence des données utilisées par Otelo. Il fixe donc le point de départ de votre scénario : votre estimation commence au 1er janvier de l'année du millésime.",
})

export const RESTRUCTURATION_DEFINITION: Definition = {
  title: 'Des logements créés dans le parc existant',
  description:
    "Le taux de restructuration mesure les logements créés chaque année sans construction neuve : par exemple la division d'un grand logement ou la transformation de bureaux en logements. Plus ces créations sont nombreuses, plus elles contribuent à couvrir le besoin.",
}

export const DISAPPEARANCE_DEFINITION: Definition = {
  title: 'Des logements qui sortent du parc',
  description:
    "Le taux de disparition mesure les logements qui sortent du parc chaque année : démolition, fusion de plusieurs logements ou transformation d'un logement en local d'activité. Ces disparitions doivent être compensées et augmentent donc le besoin en logements.",
}
