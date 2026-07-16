import type { WizardStepSlug } from '../settings/wizard-steps'

/**
 * Contenu du mode tuto du parcours de création, indexé par étape.
 *
 * Les textes sont dérivés des contenus déjà validés du produit (guide, FAQ, textes en page)
 * ou des règles lues dans le code.
 *
 * La modification réutilise les mêmes slugs mais d'autres composants : son contenu devra
 * vivre dans son propre registre, d'où le préfixe `CREATION_`.
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

/** À étaler sur l'élément à mettre en avant : `<div {...tutorialAnchor('stepper')}>`. */
export const tutorialAnchor = (anchor: TutorialAnchor) => ({ 'data-tuto': anchor })

export const tutorialSelector = (anchor: TutorialAnchor) => `[data-tuto="${anchor}"]`

export type TutorialStep = {
  anchor: TutorialAnchor
  title: string
  description: string
  side?: 'top' | 'right' | 'bottom' | 'left'
  align?: 'start' | 'center' | 'end'
}

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
