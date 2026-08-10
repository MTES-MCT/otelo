import type { WizardStepSlug } from '../settings/wizard-steps'

/**
 * Contenu des modes tuto, un registre par écran couvert.
 *
 * Les textes sont dérivés des contenus déjà validés du produit (guide, FAQ, textes en page)
 * ou des règles lues dans le code.
 *
 * La modification réutilise les mêmes slugs que la création mais d'autres composants : son
 * contenu devra vivre dans son propre registre, d'où le préfixe `CREATION_`.
 */

/**
 * Ancres posées dans les pages via `tutorialAnchor()`.
 * L'union sert de contrat côté contenu : une faute de frappe ne compile pas. La pose dans
 * le JSX, elle, n'est pas vérifiable par le typage — une ancre jamais posée est filtrée au
 * démarrage plutôt que d'afficher une bulle orpheline.
 */
export type TutorialAnchor =
  // choix-du-territoire
  | 'stepper'
  | 'method-cards'
  | 'card-existing-group'
  | 'card-bassin'
  | 'card-custom'
  | 'next-step'
  // cadrage-temporel
  | 'projection-period'
  // parametrages-demographique
  | 'population-select'
  | 'omphale-select'
  // taux-cibles-logements-vacants
  | 'long-term-vacancy-rate'
  | 'short-term-vacancy-rate'
  // taux-cibles-residences-secondaires
  | 'secondary-rate'
  // taux-restructuration-disparition
  | 'restructuration-rate'
  | 'disappearance-rate'
  // page de résultats
  | 'results-scenarios'
  | 'results-settings'
  | 'results-total-need'
  | 'results-needs-split'
  | 'results-existing-parc'
  | 'results-synthesis-chart'
  | 'results-annual-needs'
  | 'results-parc-evolution'
  | 'results-epcis-details'
  | 'results-bad-housing'

/** À étaler sur l'élément à mettre en avant : `<div {...tutorialAnchor('stepper')}>`. */
export const tutorialAnchor = (anchor: TutorialAnchor) => ({ 'data-tuto': anchor })

export const tutorialSelector = (anchor: TutorialAnchor) => `[data-tuto="${anchor}"]`

/**
 * Une étape vise soit une de nos ancres, soit — faute de mieux — un sélecteur brut.
 * Le sélecteur est l'échappatoire pour le balisage que nous ne produisons pas : les
 * composants DSFR n'acceptent que les props qu'ils déclarent et refusent un attribut
 * arbitraire. À n'utiliser que dans ce cas : un sélecteur de classe n'est pas protégé
 * contre une montée de version du DSFR.
 */
type TutorialTarget = { anchor: TutorialAnchor; selector?: never } | { anchor?: never; selector: string }

export type TutorialStep = TutorialTarget & {
  title: string
  description: string
  side?: 'top' | 'right' | 'bottom' | 'left'
  align?: 'start' | 'center' | 'end'
}

export const tutorialStepSelector = (step: TutorialStep): string =>
  step.anchor === undefined ? step.selector : tutorialSelector(step.anchor)

export const CREATION_TUTORIAL_CONTENT: Partial<Record<WizardStepSlug, TutorialStep[]>> = {
  'choix-du-territoire': [
    {
      anchor: 'stepper',
      title: 'Où en êtes-vous ?',
      description:
        "Construire un scénario prend 6 étapes : le territoire, l'horizon de projection, puis les hypothèses clés (démographie, vacance, résidences secondaires, dynamique du parc). Vos choix sont conservés dans l'adresse de la page : revenir en arrière ne les perd pas.",
      side: 'bottom',
      align: 'start',
    },
    {
      anchor: 'method-cards',
      title: 'Le choix qui structure tout le reste',
      description:
        "Un EPCI est un regroupement de communes qui travaillent ensemble sur des projets communs. Un bassin d'habitat regroupe plusieurs EPCI pour former une aire de marché du logement cohérente, du point de vue des déplacements domicile-travail. C'est à cette échelle que le besoin en logements sera calculé.",
      side: 'top',
      align: 'center',
    },
    {
      anchor: 'card-existing-group',
      title: 'Repartir d’un périmètre déjà constitué',
      description:
        "Reprend un groupe d'EPCI que vous avez précédemment sauvegardé, pour comparer plusieurs scénarios sur le même territoire.",
      side: 'bottom',
      align: 'start',
    },
    {
      anchor: 'card-bassin',
      title: 'Partir d’un bassin d’habitat',
      description:
        "Périmètre prédéfini, non modifiable. Les bassins d'habitat comptent au moins 50 000 habitants, seuil nécessaire pour disposer de projections démographiques jugées robustes par l'INSEE. Cette échelle permet de questionner les relations entre EPCI voisins plutôt que de raisonner sur un EPCI isolé.",
      side: 'bottom',
      align: 'center',
    },
    {
      anchor: 'card-custom',
      title: 'Composer un territoire à façon',
      description:
        "Vous sélectionnez les EPCI manuellement, en vous appuyant sur les EPCI limitrophes proposés. Pratique pour travailler sur un SCoT ou un autre périmètre que le bassin d'habitat.",
      side: 'bottom',
      align: 'end',
    },
    {
      anchor: 'next-step',
      title: 'Pourquoi le bouton est-il grisé ?',
      description:
        "Il s'active une fois le territoire sélectionné et nommé. Le nom doit être libre : s'il est déjà porté par un de vos groupes, le passage à l'étape suivante reste bloqué.",
      side: 'top',
      align: 'end',
    },
  ],

  'cadrage-temporel': [
    {
      anchor: 'projection-period',
      title: 'À quelle date estimer le besoin ?',
      description:
        "L'horizon de projection est la date à laquelle vous souhaitez estimer le besoin en logements. Tous les paramétrages suivants s'y appliqueront. Gardez à l'esprit que plus l'horizon est lointain, plus l'incertitude augmente.",
      side: 'bottom',
      align: 'start',
    },
    {
      anchor: 'projection-period',
      title: 'Le cas du pic de ménages',
      description:
        "Quand le nombre de ménages diminue sur un territoire, les besoins en nouveaux logements deviennent nuls. Otelo détecte cette situation et ramène automatiquement l'horizon à l'année du pic ; les taux cibles de vacance et de résidences secondaires y sont alors rapportés.",
      side: 'bottom',
      align: 'start',
    },
  ],

  'parametrages-demographique': [
    {
      anchor: 'population-select',
      title: 'D’où viennent ces projections ?',
      description:
        "Otelo s'appuie sur les projections démographiques Omphale de l'INSEE, un modèle de référence qui simule l'évolution de la population selon des hypothèses de natalité, de mortalité et de migration. Le choix s'applique à l'ensemble des EPCI du territoire d'étude.",
      side: 'bottom',
      align: 'start',
    },
    {
      anchor: 'population-select',
      title: 'Attention au nom des scénarios',
      description:
        "« Population basse » ne signifie pas forcément une perte d'habitants, mais une évolution plus faible que dans les autres scénarios.",
      side: 'bottom',
      align: 'start',
    },
    {
      anchor: 'omphale-select',
      title: 'Décohabitation : pourquoi ça change le besoin',
      description:
        'La décohabitation est le phénomène par lequel des personnes quittent un logement partagé pour créer des ménages indépendants. Les scénarios se distinguent par son rythme. À population égale, plus la décohabitation est forte, plus il faut de logements.',
      side: 'bottom',
      align: 'start',
    },
  ],

  'taux-cibles-logements-vacants': [
    {
      anchor: 'long-term-vacancy-rate',
      title: 'Un réservoir de logements mobilisables',
      description:
        "La vacance de longue durée désigne les logements vacants depuis plus de deux ans. Elle peut, en partie, constituer un gisement de logements remobilisables : la réduire diminue d'autant le besoin en constructions neuves. Par défaut, Otelo retient une réduction de 15 % de cette part à l'horizon de projection.",
      side: 'bottom',
      align: 'start',
    },
    {
      anchor: 'short-term-vacancy-rate',
      title: 'Pourquoi ce taux n’est pas modifiable',
      description:
        'La vacance de courte durée est une vacance de rotation, nécessaire au bon fonctionnement du parc : elle permet les déménagements, les ventes, les mises en location ou les travaux entre deux occupations. Otelo la considère stable et ne propose pas de la modifier.',
      side: 'bottom',
      align: 'start',
    },
    {
      anchor: 'long-term-vacancy-rate',
      title: 'Un taux qui baisse n’est pas un volume qui baisse',
      description:
        "Si le parc total augmente fortement sur la période, le nombre de logements vacants de longue durée peut rester stable, voire augmenter, tout en représentant une part plus faible du parc. La vitesse d'évolution dépend aussi de l'horizon retenu : −15 % à 2035 impose un rythme plus rapide qu'à 2050.",
      side: 'bottom',
      align: 'start',
    },
  ],

  'taux-cibles-residences-secondaires': [
    {
      anchor: 'secondary-rate',
      title: 'Dans quel sens joue ce taux ?',
      description:
        "Viser un taux inférieur à la valeur observée revient à supposer qu'une partie des résidences secondaires accueillera des ménages à titre de résidence principale : le besoin en logements neufs diminue. Viser un taux plus élevé revient à en consacrer une part plus importante à cet usage, et augmente donc le besoin.",
      side: 'bottom',
      align: 'start',
    },
    {
      anchor: 'secondary-rate',
      title: 'Valeur par défaut',
      description:
        'Par défaut, le taux cible correspond à la dernière valeur observée dans les données fiscales retraitées par le CGDD/SDES : le scénario reconduit donc la situation actuelle tant que vous ne le modifiez pas.',
      side: 'bottom',
      align: 'start',
    },
    {
      anchor: 'secondary-rate',
      title: 'Taux et volume, à nouveau',
      description:
        "Comme pour la vacance, un taux en baisse n'implique pas mécaniquement une baisse du nombre de résidences secondaires si le parc total progresse dans le même temps.",
      side: 'bottom',
      align: 'start',
    },
  ],

  'taux-restructuration-disparition': [
    {
      anchor: 'restructuration-rate',
      title: 'Des logements créés dans le parc existant',
      description:
        "Les restructurations correspondent aux créations de logements au sein du parc existant : division de logements, ou changement d'usage comme la transformation de locaux d'activités en logements. Plus ce taux est élevé, moins le besoin en logements neufs est important.",
      side: 'bottom',
      align: 'start',
    },
    {
      anchor: 'disappearance-rate',
      title: 'Des logements qui sortent du parc',
      description:
        "Le taux de disparition est la proportion du parc qui disparaît au cours d'une année : démolitions, mais aussi fusions de logements ou transformation d'un logement en local d'activité. Plus ce taux est élevé, plus le besoin en logements neufs augmente.",
      side: 'bottom',
      align: 'start',
    },
    {
      anchor: 'restructuration-rate',
      title: 'Le paramètre à discuter localement',
      description:
        'Otelo reconduit par défaut les taux annuels observés. Ce paramétrage mérite une attention particulière sur les territoires ayant connu des opérations de rénovation urbaine avec des démolitions importantes, notamment dans le parc social : la reconduction mécanique du taux observé peut y être inadaptée.',
      side: 'bottom',
      align: 'start',
    },
  ],
}

/**
 * Contenu du mode tuto de la page de résultats.
 *
 * Liste unique et non indexée, contrairement à la création : la page n'a pas d'étapes mais
 * des onglets — « Synthèse des besoins » puis un onglet par EPCI — dont un seul est monté
 * à la fois. Les ancres absentes de l'onglet courant sont filtrées au démarrage, si bien
 * que l'ordre ci-dessous, calqué sur l'ordre du DOM, produit le bon parcours dans les deux
 * cas sans qu'on ait à tenir deux registres.
 */
export const RESULTS_TUTORIAL_CONTENT: TutorialStep[] = [
  {
    anchor: 'results-scenarios',
    title: 'Comparer plusieurs scénarios',
    description:
      "Les scénarios élaborés sur ce même territoire s'affichent ici côte à côte. Basculer de l'un à l'autre conserve l'onglet et la vue en cours : c'est la façon la plus directe de mesurer ce que change une hypothèse.",
    side: 'bottom',
    align: 'start',
  },
  {
    // Le DSFR ne laisse pas poser d'attribut sur la liste d'onglets : on la vise par sa classe.
    selector: '.fr-tabs__list',
    title: 'Deux échelles de lecture',
    description:
      "L'onglet « Synthèse des besoins » agrège l'ensemble du territoire d'étude. Les onglets suivants détaillent chaque EPCI : c'est là que se lisent les écarts internes au territoire, qu'un total masque toujours.",
    side: 'bottom',
    align: 'start',
  },
  {
    anchor: 'results-settings',
    title: 'Les hypothèses derrière ces chiffres',
    description:
      '« Paramétrage » déplie les hypothèses retenues pour ce scénario : projection démographique, taux cibles de vacance et de résidences secondaires, renouvellement urbain. Aucun résultat de cette page ne se lit indépendamment de ces choix.',
    side: 'bottom',
    align: 'start',
  },
  {
    anchor: 'results-total-need',
    title: 'Le besoin en logements neufs',
    description:
      "C'est le nombre de logements à construire d'ici l'horizon de projection. Il additionne deux composantes : le besoin lié aux évolutions démographiques et à celles du parc, et la part des situations de mal-logement qui appelle une construction neuve.",
    side: 'top',
    align: 'start',
  },
  {
    anchor: 'results-total-need',
    title: 'Un besoin, pas un objectif',
    description:
      "Otelo estime un besoin sous les hypothèses que vous avez retenues. Ce n'est ni une prévision, ni un objectif de production : la traduction en objectifs relève du débat local et des documents de planification.",
    side: 'top',
    align: 'start',
  },
  {
    anchor: 'results-needs-split',
    title: 'À quels besoins répondent ces logements ?',
    description:
      "La répartition entre démographie et mal-logement dit à quoi sert la construction neuve sur ce territoire. Un poids fort du mal-logement signale un besoin déjà constitué aujourd'hui, indépendant de l'évolution du nombre de ménages.",
    side: 'top',
    align: 'start',
  },
  {
    anchor: 'results-existing-parc',
    title: 'Ce que le parc existant absorbe',
    description:
      'Ces volumes sont déjà déduits du besoin affiché plus haut : ils traduisent vos taux cibles. Remobiliser des logements vacants de longue durée, ramener des résidences secondaires vers la résidence principale, créer des logements par restructuration du parc — autant de logements neufs qui ne seront pas à construire.',
    side: 'top',
    align: 'start',
  },
  {
    anchor: 'results-synthesis-chart',
    title: 'Le rythme, EPCI par EPCI',
    description:
      "Le besoin réparti année par année, superposé aux permis autorisés et aux logements commencés issus de Sit@del2. L'écart entre les deux mesure la distance entre le besoin estimé et la production récemment observée.",
    side: 'top',
    align: 'start',
  },
  {
    anchor: 'results-annual-needs',
    title: 'Le besoin annualisé',
    description:
      "Le besoin total ramené à un rythme annuel, confronté aux logements autorisés et commencés des dernières années d'après Sit@del2. C'est le format le plus directement comparable aux objectifs d'un document de planification.",
    side: 'top',
    align: 'start',
  },
  {
    anchor: 'results-parc-evolution',
    title: "D'où vient le besoin",
    description:
      'Le graphique décompose le besoin lié au flux : évolution du nombre de ménages, renouvellement urbain, résidences secondaires, vacance. Les postes négatifs sont ceux que le parc existant prend en charge.',
    side: 'top',
    align: 'start',
  },
  {
    anchor: 'results-epcis-details',
    title: 'Le détail chiffré par EPCI',
    description:
      "Le même calcul, ligne à ligne pour chaque EPCI du territoire. La dernière colonne rappelle la période retenue : elle peut s'arrêter avant l'horizon de projection si l'EPCI atteint son pic de ménages plus tôt.",
    side: 'top',
    align: 'start',
  },
  {
    anchor: 'results-bad-housing',
    title: 'Les situations de mal-logement',
    description:
      "La ventilation du besoin en stock par type de situation : personnes hébergées chez un tiers, hors logement, ménages au taux d'effort excessif, logement trop petit ou précaire. « Affiner le mal-logement » permet d'en revoir l'horizon de résorption et le périmètre.",
    side: 'top',
    align: 'start',
  },
]
