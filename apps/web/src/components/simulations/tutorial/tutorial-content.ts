import { getObservedRatesPeriodLabel } from '~/utils/projection'
import type { WizardStepSlug } from '../settings/wizard-steps'

/**
 * Contenu des modes tuto, un registre par écran couvert.
 *
 * Les textes sont repris du référentiel « Proposition Didacticiel » validé par l'équipe métier :
 * quatre registres d'aide s'y côtoient — prise en main, méthodologie, lecture & interprétation,
 * conseils & bonnes pratiques — et c'est cet équilibre, pas seulement l'exactitude, qu'il faut
 * préserver en les modifiant.
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
  // colonne de gauche, présente sur toutes les étapes de la création
  | 'side-menu'
  // choix-du-territoire
  | 'method-cards'
  | 'card-existing-group'
  | 'card-bassin'
  | 'card-custom'
  | 'epci-search'
  | 'selected-epcis'
  | 'urbanisme-doc'
  | 'epci-group-name'
  | 'next-step'
  // cadrage-temporel
  | 'millesime-select'
  | 'projection-range'
  | 'projection-period-label'
  // parametrages-demographique
  | 'population-select'
  | 'population-chart'
  | 'omphale-select'
  | 'omphale-chart'
  // présent dans les deux onglets de l'étape démographique
  | 'territory-chart-select'
  | 'demographic-data-source'
  // colonne latérale, présente de l'étape démographique à la dernière
  | 'estimation-card'
  // encart du pic de ménages, sur les deux étapes de taux cibles
  | 'peak-year-alert'
  // taux-cibles-logements-vacants
  | 'long-term-vacancy-rate'
  | 'long-term-vacancy-input'
  | 'short-term-vacancy-rate'
  | 'vacancy-parc-chart'
  | 'vacancy-toggle'
  // taux-cibles-residences-secondaires
  | 'secondary-rate'
  | 'secondary-toggle'
  // taux-restructuration-disparition
  | 'observed-rates-note'
  | 'restructuration-rate'
  | 'disappearance-rate'
  | 'renewal-reading-key'
  | 'restructuration-toggle'
  // page de résultats
  | 'results-scenarios'
  | 'results-settings'
  | 'results-share'
  | 'results-export'
  | 'results-total-need'
  | 'results-needs-split'
  | 'results-existing-parc'
  | 'results-vacancy-card'
  | 'results-renewal-card'
  | 'results-synthesis-chart'
  | 'results-annual-needs'
  | 'results-parc-evolution'
  | 'results-epcis-details'
  // posées seulement quand le cas particulier se présente : pic de ménages avant l'horizon,
  // volume de logements excédentaires non nul
  | 'results-peak-year'
  | 'results-surplus-housing'
  | 'results-bad-housing'
  // sous-parcours « Affiner le mal-logement »
  | 'bad-housing-side-menu'
  | 'bad-housing-resorption-horizon'
  | 'bad-housing-part'

/** À étaler sur l'élément à mettre en avant : `<div {...tutorialAnchor('side-menu')}>`. */
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
  /**
   * Fragment HTML, pas du texte brut : driver.js pose la description en `innerHTML`.
   *
   * Le référentiel métier met en avant une phrase clé par bulle, que `<strong>` restitue.
   * Ces textes sont écrits ici, jamais reçus de l'extérieur — n'y interpolez que des valeurs
   * du scénario, typées et numériques, faute de quoi il faudrait les échapper.
   */
  description: string
  side?: 'top' | 'right' | 'bottom' | 'left'
  align?: 'start' | 'center' | 'end'
  /**
   * Ne joue l'étape que si cette autre ancre est visible.
   *
   * Sert aux bulles dont la cible est permanente mais le propos non : le mot d'accueil vise
   * la colonne des 6 étapes, présente partout, alors qu'il ne vaut que tant que l'utilisateur
   * n'a pas commencé. Le viser directement sur l'élément éphémère déplacerait le projecteur
   * au mauvais endroit.
   */
  visibleWith?: TutorialAnchor
}

export const tutorialStepSelector = (step: TutorialStep): string =>
  step.anchor === undefined ? step.selector : tutorialSelector(step.anchor)

/**
 * Valeurs du scénario en cours, citées par les bulles qui les mentionnent.
 *
 * Le référentiel métier écrit ces textes avec des trous — « pic de ménages en [X], avant
 * l'horizon [Y] » — que seul le scénario affiché peut combler. Chaque champ est donc
 * facultatif : quand la valeur manque (elle n'est pas encore saisie, ou la page ne la
 * connaît pas), la bulle retombe sur une formulation générique plutôt que d'afficher un
 * trou ou une année fausse.
 */
export type TutorialContext = {
  /** Année de référence des données, et début de la période de projection. */
  millesime?: number | null
  /** Horizon de projection retenu. */
  projection?: number | null
  /** Année du pic de ménages du territoire affiché, lorsqu'elle précède l'horizon. */
  peakYear?: number | null
}

/**
 * Le conseil sur l'infographie vise un lien de l'en-tête, hors de notre balisage : le DSFR
 * construit sa navigation lui-même. On le vise par son `href`, stable, plutôt que par une
 * classe susceptible de bouger avec la version. L'en-tête étant rendu deux fois (menu
 * bureau et menu mobile), c'est l'occurrence visible qui est retenue au démarrage.
 */
const INFOGRAPHIE_STEP: TutorialStep = {
  selector: 'header a[href="/infographies"]',
  title: 'Besoin de mieux comprendre la dynamique du territoire ?',
  description:
    "L'Infographie rassemble des données de cadrage sur les évolutions passées de votre territoire. Elle peut vous aider à approfondir votre lecture si une projection vous surprend ou si vous souhaitez la confronter à des tendances plus anciennes. <strong>Elle reste utile tout au long du parcours.</strong>",
  side: 'bottom',
  align: 'center',
}

const buildCreationContent = ({ millesime, peakYear, projection }: TutorialContext): Partial<Record<WizardStepSlug, TutorialStep[]>> => ({
  'choix-du-territoire': [
    {
      anchor: 'side-menu',
      // Mot d'accueil : il n'a plus lieu d'être une fois la méthode de sélection choisie.
      visibleWith: 'method-cards',
      title: 'Construire votre scénario',
      description:
        "<strong>Votre scénario se construit en 6 étapes.</strong> Vous définissez d'abord le territoire et l'horizon de projection, puis vous choisissez vos hypothèses sur la démographie et l'évolution du parc de logements. Otelo calcule ensuite les besoins à partir de l'ensemble de ces choix.",
      side: 'right',
      align: 'start',
    },
    {
      anchor: 'method-cards',
      title: "Choisissez votre territoire d'étude",
      description:
        "Vous pouvez <strong>reprendre un territoire déjà utilisé</strong>, choisir un <strong>bassin d'habitat prédéfini</strong> ou composer vous-même un territoire à partir de plusieurs EPCI. Ces trois possibilités servent à définir le périmètre sur lequel vous allez construire votre scénario.",
      side: 'top',
      align: 'center',
    },
    {
      anchor: 'card-bassin',
      title: "Le bassin d'habitat, l'échelle de référence",
      description:
        "<strong>Le bassin d'habitat est l'échelle de référence proposée par Otelo pour estimer les besoins en logements.</strong> Il regroupe plusieurs EPCI appartenant à un même espace de fonctionnement du marché du logement. Lorsque vous recherchez un EPCI, Otelo vous propose automatiquement le bassin d'habitat auquel il appartient. Vous pourrez ensuite paramétrer et consulter les résultats de chaque EPCI qui le compose.",
      side: 'bottom',
      align: 'center',
    },
    {
      anchor: 'card-custom',
      title: 'Travailler sur un autre périmètre',
      description:
        "Votre territoire d'étude ne correspond pas à un seul bassin d'habitat ? Vous pouvez créer votre propre regroupement d'EPCI. <strong>Cette option est particulièrement utile pour travailler sur un périmètre, par exemple un SCoT, qui s'étend sur plusieurs bassins d'habitat.</strong> Otelo vous permet alors de sélectionner les EPCI limitrophes qui composent ce territoire.",
      side: 'bottom',
      align: 'end',
    },
    {
      anchor: 'card-existing-group',
      title: "Repartir d'un périmètre déjà constitué",
      description:
        "Reprend un groupe d'EPCI que vous avez précédemment sauvegardé, pour comparer plusieurs scénarios sur le même territoire sans le recomposer à chaque fois.",
      side: 'bottom',
      align: 'start',
    },
    {
      anchor: 'epci-search',
      title: 'Commencez par votre EPCI',
      description:
        "Recherchez ici l'EPCI sur lequel vous travaillez. Otelo identifiera automatiquement le bassin d'habitat auquel il appartient et ajoutera les autres EPCI qui le composent.",
      side: 'bottom',
      align: 'start',
    },
    {
      anchor: 'selected-epcis',
      title: "Votre bassin d'habitat est automatiquement constitué",
      description:
        "Une fois votre EPCI sélectionné, Otelo ajoute automatiquement les autres EPCI de son bassin d'habitat. <strong>Ce périmètre est prédéfini : vous ne pouvez pas retirer ou ajouter un EPCI à ce stade.</strong> Si ce périmètre ne correspond pas à votre territoire d'étude, revenez à la sélection personnalisée.",
      side: 'bottom',
      align: 'start',
    },
    {
      anchor: 'urbanisme-doc',
      title: 'Dans quel cadre réalisez-vous cette estimation ?',
      description:
        "Indiquez si votre scénario est réalisé dans le cadre d'un document d'urbanisme. Cette information permet notamment à Otelo de mieux rattacher votre travail à son contexte et de vous proposer <strong>un nom adapté pour votre groupe d'EPCI</strong>.",
      side: 'bottom',
      align: 'start',
    },
    {
      anchor: 'epci-group-name',
      title: 'Donnez un nom facile à retrouver',
      description:
        "Nommez ce territoire de façon à pouvoir le retrouver dans l'onglet « Tableau de bord », et le réutiliser pour de futurs scénarios.",
      side: 'top',
      align: 'start',
    },
    {
      anchor: 'next-step',
      title: "Passer à l'étape suivante",
      description:
        "<strong>Pourquoi le bouton est-il grisé ?</strong> Il s'active une fois le territoire sélectionné, la question sur le document d'urbanisme répondue, et le groupe nommé. Le nom doit être libre : s'il est déjà porté par un de vos groupes, le passage à l'étape suivante reste bloqué.",
      side: 'top',
      align: 'end',
    },
  ],

  'cadrage-temporel': [
    {
      anchor: 'millesime-select',
      title: 'Le millésime : le point de départ de votre estimation',
      description: millesime
        ? `Le <strong>millésime</strong> correspond à l'année de référence des données utilisées par Otelo. Il fixe donc le point de départ de votre scénario : avec le millésime ${millesime}, votre estimation commence au <strong>1er janvier ${millesime}</strong>.`
        : "Le <strong>millésime</strong> correspond à l'année de référence des données utilisées par Otelo. Il fixe donc le point de départ de votre scénario : votre estimation commencera au 1er janvier de l'année retenue.",
      side: 'bottom',
      align: 'start',
    },
    {
      anchor: 'projection-range',
      title: 'Jusqu’à quand souhaitez-vous vous projeter ?',
      description:
        "Choisissez ici l'horizon de projection, c'est-à-dire la date jusqu'à laquelle vous souhaitez estimer les besoins en logements. Les hypothèses que vous définirez ensuite — démographie, vacance, résidences secondaires… — seront projetées jusqu'à cette date.",
      side: 'bottom',
      align: 'start',
    },
    {
      anchor: 'projection-period-label',
      title: 'Vérifiez bien la période de votre scénario',
      description:
        millesime && projection
          ? `<strong>Otelo raisonne du 1er janvier au 1er janvier</strong> : avec le millésime ${millesime} et l'horizon ${projection}, l'estimation porte du <strong>1er janvier ${millesime} au 1er janvier ${projection}</strong>. Cette période sera utilisée pour calculer et présenter vos besoins en logements. Si vous souhaitez estimer les besoins en logements d'une année N, indiquez l'année N+1 avec le curseur.`
          : "<strong>Otelo raisonne du 1er janvier au 1er janvier</strong>. Avec un millésime 2022 et un horizon 2035, l'estimation porte donc du <strong>1er janvier 2022 au 1er janvier 2035</strong>. Cette période sera utilisée pour calculer et présenter vos besoins en logements. Si vous souhaitez estimer les besoins en logements d'une année N, indiquez l'année N+1 avec le curseur.",
      side: 'bottom',
      align: 'start',
    },
  ],

  'parametrages-demographique': [
    {
      // Le DSFR ne laisse pas poser d'attribut sur sa liste d'onglets : on la vise par sa classe.
      selector: '.fr-tabs__list',
      // Mot d'ouverture de l'étape : réservé à l'onglet Population, par lequel on arrive.
      visibleWith: 'population-select',
      title: 'Construisez votre trajectoire démographique',
      description:
        "Cette étape permet de définir <strong>combien d'habitants et combien de ménages votre territoire pourrait compter à l'horizon de projection choisi</strong>. Vous allez d'abord choisir une projection de population, puis une projection du nombre de ménages correspondant à cette trajectoire. <strong>C'est l'évolution du nombre de ménages qui déterminera ensuite le besoin démographique en résidences principales.</strong>",
      side: 'bottom',
      align: 'start',
    },
    {
      anchor: 'population-select',
      title: 'Que signifient les scénarios bas, central et haut ?',
      description:
        "Otelo s'appuie sur les projections démographiques Omphale de l'INSEE, un modèle de référence qui simule l'évolution de la population selon des hypothèses de natalité, de mortalité et de migration. <strong>Elles décrivent plusieurs futurs possibles, pas trois niveaux de besoin en logements.</strong> Un scénario « bas » ne signifie donc pas nécessairement une baisse de population. Le scénario central, lui, n'est pas toujours un simple prolongement de la tendance récente.",
      side: 'bottom',
      align: 'start',
    },
    {
      anchor: 'population-chart',
      title: 'Regardez ce que la projection change pour votre territoire',
      description:
        "Le graphique met en regard <strong>l'évolution récente de la population et les trajectoires projetées</strong>. Il permet de voir si une projection prolonge la tendance passée, la ralentit ou marque une rupture.",
      side: 'top',
      align: 'center',
    },
    {
      anchor: 'omphale-select',
      title: 'Pour ce scénario de population, combien de résidences principales ?',
      description:
        "Pour estimer le besoin en résidences principales, ce n'est pas seulement le nombre d'habitants qui compte, mais le nombre de ménages qu'ils forment : un ménage correspond à une résidence principale occupée. Une population stable peut donc générer des besoins supplémentaires si le nombre de ménages augmente, par exemple sous l'effet du vieillissement ou de la décohabitation.",
      side: 'bottom',
      align: 'start',
    },
    {
      anchor: 'omphale-select',
      title: 'Que choisissez-vous ici ?',
      description:
        '<strong>Comment les modes de cohabitation vont évoluer pour la population déjà projetée</strong>. Une décohabitation plus rapide crée davantage de ménages ; une décohabitation plus lente en crée moins. Ce choix modifie donc directement le besoin en résidences principales.',
      side: 'bottom',
      align: 'start',
    },
    {
      anchor: 'omphale-chart',
      title: 'Regardez ce que la projection change pour votre territoire',
      description:
        "Le graphique met en regard <strong>l'évolution récente du nombre de ménages et les trajectoires projetées</strong>. Il permet de voir si une projection prolonge la tendance passée, la ralentit ou marque une rupture.",
      side: 'top',
      align: 'center',
    },
    {
      anchor: 'omphale-chart',
      title: 'Attention au pic de ménages',
      description:
        "Le nombre de ménages peut augmenter pendant quelques années puis diminuer <strong>avant l'horizon que vous avez choisi</strong>. Dans ce cas, regarder uniquement la situation à l'année finale masquerait une partie des besoins qui auront existé entre-temps. Otelo repère donc cette <strong>année du maximum</strong> pour tenir compte de toute la trajectoire.",
      side: 'top',
      align: 'center',
    },
    {
      anchor: 'territory-chart-select',
      title: 'Un choix pour tout le territoire, une lecture EPCI par EPCI',
      description:
        "Vous pouvez afficher le graphique pour chaque EPCI ou pour l'ensemble du territoire afin de comparer leurs trajectoires. <strong>Le scénario que vous sélectionnez s'applique toutefois à l'ensemble des EPCI de votre étude</strong> : changer le territoire affiché ne change pas votre paramétrage.",
      side: 'left',
      align: 'start',
    },
    {
      anchor: 'territory-chart-select',
      title: 'La même source de données, mais pas la même échelle',
      description:
        "Pour les EPCI de plus de 50 000 habitants, la trajectoire est directement calculée à cette échelle. Pour les autres, elle peut être issue du bassin d'habitat. Lorsque le bassin ne dispose pas lui-même d'une projection suffisamment robuste, Otelo s'appuie sur une projection départementale, ensuite répartie entre les territoires concernés. <strong>Cette information est importante pour apprécier le niveau de précision de la projection que vous utilisez.</strong>",
      side: 'left',
      align: 'start',
    },
    INFOGRAPHIE_STEP,
    {
      anchor: 'estimation-card',
      title: 'Votre estimation se construit ici',
      description:
        'Chaque étape ajoute ses termes à cette carte : la démographie et le mal-logement maintenant, puis la vacance, les résidences secondaires et le renouvellement urbain. Les lignes en cours de paramétrage sont mises en couleur. Les situations de mal-logement (*) sont reprises telles quelles à ce stade : leur résorption — quelles situations retenir et à quel horizon les résorber — se paramètre depuis la page de résultats.',
      side: 'left',
      align: 'start',
    },
    {
      anchor: 'demographic-data-source',
      title: 'Sources de données',
      description:
        "Population : modèle Omphale de l'INSEE (2018-2070). Ménages : scénarios de décohabitation du SDES (2018-2050) croisés avec Omphale. Dans les deux cas, les données sont recalées à la valeur observée dans le millésime du recensement de la population retenu comme année de référence.",
      side: 'top',
      align: 'start',
    },
  ],

  'taux-cibles-logements-vacants': [
    {
      anchor: 'peak-year-alert',
      title: 'Le nombre de ménages atteint un maximum avant votre horizon',
      description:
        peakYear && projection
          ? `Votre projection prévoit un <strong>pic de ménages en ${peakYear}</strong>, avant l'horizon ${projection}. À partir de cette date, le besoin en résidences principales n'augmente plus. Otelo considère donc que les objectifs de vacance et de résidences secondaires doivent être atteints en <strong>${peakYear}</strong>, et non en ${projection}. Vous retrouverez cette date à l'étape suivante.`
          : "Votre projection prévoit un <strong>pic de ménages</strong> avant l'horizon choisi. À partir de cette date, le besoin en résidences principales n'augmente plus. Otelo considère donc que les objectifs de vacance et de résidences secondaires doivent être atteints à l'année du pic, et non à l'horizon. Vous retrouverez cette date à l'étape suivante.",
      side: 'bottom',
      align: 'start',
    },
    {
      anchor: 'long-term-vacancy-rate',
      title: 'Un réservoir de logements mobilisables',
      description:
        'La vacance de longue durée désigne les logements vacants depuis plus de deux ans. Elle peut, en partie, constituer un gisement de logements remobilisables, notamment comme résidences principales.',
      side: 'bottom',
      align: 'start',
    },
    {
      anchor: 'long-term-vacancy-input',
      title: 'La valeur par défaut',
      description:
        "Otelo propose par défaut de <strong>réduire de 15 % le taux de vacance de longue durée observé</strong> dans chaque EPCI. Cette valeur sert de point de départ au scénario : ce n'est ni une norme ni un objectif national. Vous pouvez l'adapter au gisement réellement mobilisable et aux actions prévues sur votre territoire.",
      side: 'bottom',
      align: 'start',
    },
    {
      anchor: 'long-term-vacancy-input',
      title: 'Quel effet sur les besoins en logements ?',
      description:
        "Réduire la vacance de longue durée revient à supposer qu'une partie de ces logements pourra redevenir disponible. <strong>Plus la réduction retenue est importante, plus le parc existant couvre une part du besoin, et moins la construction neuve sera élevée.</strong> Attention : vous réduisez ici le <strong>taux</strong> de vacance. Par exemple, réduire de 15 % un taux de 2 % conduit à un taux cible de <strong>1,7 %</strong>.",
      side: 'bottom',
      align: 'start',
    },
    {
      anchor: 'vacancy-parc-chart',
      title: 'À noter',
      description:
        "Le taux est calculé par rapport à l'ensemble du parc. Si le parc augmente, <strong>le nombre de logements vacants peut donc augmenter alors même que leur part diminue</strong>. C'est pourquoi, dans un même scénario, Otelo peut afficher des logements remobilisés dans certains EPCI et une hausse du nombre de logements vacants dans d'autres.",
      side: 'top',
      align: 'start',
    },
    {
      anchor: 'short-term-vacancy-rate',
      title: 'Et la vacance de courte durée ?',
      description:
        'La vacance de courte durée est une vacance de rotation, nécessaire au bon fonctionnement du parc : elle permet les déménagements, les ventes, les mises en location ou les travaux entre deux occupations. Otelo la considère stable et ne propose pas de la modifier.',
      side: 'bottom',
      align: 'start',
    },
    {
      anchor: 'vacancy-toggle',
      title: 'Un même objectif pour tous les EPCI ?',
      description:
        "Par défaut, vous pouvez adapter l'objectif à chaque EPCI. Activez cette option si vous souhaitez appliquer <strong>le même pourcentage de réduction</strong> à tous les EPCI du territoire.",
      side: 'bottom',
      align: 'start',
    },
  ],

  'taux-cibles-residences-secondaires': [
    {
      anchor: 'peak-year-alert',
      title: 'Un objectif ramené à l’année du pic de ménages',
      description: peakYear
        ? `Le nombre de ménages atteint son maximum en <strong>${peakYear}</strong>, avant l'horizon de projection choisi. Le taux cible de résidences secondaires est donc rapporté à <strong>${peakYear}</strong> : au-delà, le besoin en résidences principales n'augmente plus.`
        : "Le nombre de ménages atteint son maximum avant l'horizon de projection choisi. Le taux cible de résidences secondaires est donc rapporté à l'année du pic : au-delà, le besoin en résidences principales n'augmente plus.",
      side: 'bottom',
      align: 'start',
    },
    {
      anchor: 'secondary-rate',
      title: 'La valeur par défaut',
      description:
        "Si vous ne modifiez rien, Otelo conserve à l'horizon <strong>la même part de résidences secondaires dans le parc</strong> que celle observée au départ. Cela ne signifie pas que leur nombre restera identique : si le parc total augmente, leur nombre peut lui aussi augmenter.",
      side: 'bottom',
      align: 'start',
    },
    {
      anchor: 'secondary-rate',
      title: 'Quel effet sur les besoins en logements ?',
      description:
        "Viser un taux <strong>plus faible</strong> revient à supposer qu'une partie des résidences secondaires pourra devenir résidence principale : le besoin à couvrir diminue. Viser un taux <strong>plus élevé</strong> réserve au contraire une part plus importante du parc aux résidences secondaires : le besoin augmente.",
      side: 'bottom',
      align: 'start',
    },
    {
      anchor: 'secondary-rate',
      title: 'À noter',
      description:
        "Une baisse du taux ne signifie pas forcément une baisse du nombre de résidences secondaires. <strong>Si le parc augmente fortement, leur nombre peut progresser tout en représentant une part plus faible des logements.</strong> C'est cette évolution conjointe qu'il faut regarder pour comprendre l'effet du paramétrage.",
      side: 'top',
      align: 'start',
    },
    {
      anchor: 'secondary-toggle',
      title: 'Un même objectif pour tous les EPCI ?',
      description:
        'Par défaut, vous pouvez fixer un objectif différent pour chaque EPCI. Activez cette option si vous souhaitez appliquer <strong>le même taux cible</strong> à tous les EPCI.',
      side: 'bottom',
      align: 'start',
    },
  ],

  'taux-restructuration-disparition': [
    {
      anchor: 'restructuration-rate',
      title: 'Des logements créés dans le parc existant',
      description:
        "Le taux de restructuration mesure les logements <strong>créés chaque année sans construction neuve</strong> : par exemple la division d'un grand logement ou la transformation de bureaux en logements. Plus ces créations sont nombreuses, plus elles contribuent à couvrir le besoin.",
      side: 'bottom',
      align: 'start',
    },
    {
      anchor: 'disappearance-rate',
      title: 'Des logements qui sortent du parc',
      description:
        "Le taux de disparition mesure les logements qui <strong>sortent du parc chaque année</strong> : démolition, fusion de plusieurs logements ou transformation d'un logement en local d'activité. Ces disparitions doivent être compensées et augmentent donc le besoin en logements.",
      side: 'bottom',
      align: 'start',
    },
    {
      anchor: 'observed-rates-note',
      title: 'Ne reconduisez pas automatiquement le passé',
      description: `Otelo prolonge par défaut les <strong>taux annuels observés entre ${getObservedRatesPeriodLabel(millesime)}</strong>. Vérifiez qu'ils correspondent bien à ce que vous anticipez. Par exemple, si cette période comprend une importante opération ponctuelle de démolition, reconduire ce rythme chaque année jusqu'à l'horizon peut fortement surestimer les disparitions futures.`,
      side: 'bottom',
      align: 'start',
    },
    {
      anchor: 'renewal-reading-key',
      title: 'Quel effet sur les besoins en logements ?',
      description:
        'Otelo met en balance les logements créés par restructuration et ceux qui disparaissent. <strong>Si les créations sont supérieures aux disparitions, le besoin à produire diminue ; si les disparitions sont supérieures, il augmente.</strong> La clé de lecture traduit directement ce solde en logements par an.',
      side: 'top',
      align: 'start',
    },
    {
      anchor: 'restructuration-toggle',
      title: 'Les mêmes dynamiques pour tous les EPCI ?',
      description:
        'Par défaut, les taux peuvent être adaptés EPCI par EPCI. Activez cette option uniquement si vous souhaitez appliquer <strong>les mêmes taux annuels de restructuration et de disparition</strong> à tout le territoire.',
      side: 'bottom',
      align: 'start',
    },
  ],
})

/**
 * Étapes du parcours de création pour l'écran demandé, ou `undefined` s'il n'est pas couvert.
 *
 * À mémoïser côté appelant : `useTutorial` referme le tuto quand l'identité du tableau change,
 * pour ne pas laisser un popover ouvert au changement d'écran.
 */
export const getCreationTutorialSteps = (slug: WizardStepSlug, context: TutorialContext): TutorialStep[] | undefined =>
  buildCreationContent(context)[slug]

/**
 * Contenu du mode tuto de la page de résultats.
 *
 * Liste unique et non indexée, contrairement à la création : la page n'a pas d'étapes mais
 * des onglets — « Synthèse des besoins » puis un onglet par EPCI — dont un seul est monté
 * à la fois. Les ancres absentes de l'onglet courant sont filtrées au démarrage, si bien
 * que l'ordre ci-dessous, calqué sur l'ordre du DOM, produit le bon parcours dans les deux
 * cas sans qu'on ait à tenir deux registres.
 */
export const getResultsTutorialSteps = ({ peakYear }: TutorialContext): TutorialStep[] => [
  {
    anchor: 'results-total-need',
    title: 'Vous lisez le résultat d’un scénario',
    description:
      "Le résultat affiché est la conséquence des hypothèses que vous avez retenues. Il ne constitue ni une prévision certaine, ni un objectif imposé au territoire. Pour l'interpréter, regardez ce qui crée le besoin, ce que le parc existant peut couvrir et comment le besoin évolue dans le temps.",
    side: 'top',
    align: 'start',
  },
  {
    anchor: 'results-settings',
    title: 'Un résultat se lit toujours avec ses hypothèses',
    description:
      'Retrouvez ici les choix qui ont produit ce résultat : période, démographie, vacance, résidences secondaires, renouvellement urbain et, après affinage, mal-logement. Deux résultats ne sont comparables que si leurs hypothèses sont explicites.',
    side: 'bottom',
    align: 'start',
  },
  {
    anchor: 'results-scenarios',
    title: 'Testez les hypothèses plutôt que de vous arrêter au premier chiffre',
    description:
      "Créez plusieurs scénarios pour mesurer l'effet d'une hypothèse et identifier les paramètres qui font réellement varier le besoin. Otelo sert à comparer des trajectoires possibles, pas à produire une réponse unique.",
    side: 'bottom',
    align: 'start',
  },
  {
    // Le DSFR ne laisse pas poser d'attribut sur la liste d'onglets : on la vise par sa classe.
    selector: '.fr-tabs__list',
    title: 'Du territoire à chaque EPCI',
    description:
      "La synthèse agrège le résultat de l'ensemble du territoire. Les onglets EPCI permettent ensuite de voir où se situent les besoins et les leviers. Un total territorial peut masquer des trajectoires très différentes entre EPCI.",
    side: 'bottom',
    align: 'start',
  },
  {
    anchor: 'results-total-need',
    title: 'Ce qu’il resterait à couvrir par la construction neuve',
    description:
      'Otelo ne suppose pas que tous les logements nécessaires doivent être construits : il tient compte des logements remobilisés ou créés dans le parc existant. Le chiffre affiché correspond donc au besoin résiduel de construction neuve une fois ces leviers intégrés.',
    side: 'top',
    align: 'start',
  },
  {
    anchor: 'results-peak-year',
    title: 'Après le pic de ménages, la lecture du besoin change',
    description: peakYear
      ? `Le nombre de ménages atteint son maximum en <strong>${peakYear}</strong>. Après cette date, le besoin lié à l'augmentation des résidences principales ne progresse plus ; d'autres besoins peuvent toutefois subsister, notamment pour le mal-logement ou le renouvellement du parc.`
      : "Le nombre de ménages atteint son maximum avant l'horizon de projection. Après cette date, le besoin lié à l'augmentation des résidences principales ne progresse plus ; d'autres besoins peuvent toutefois subsister, notamment pour le mal-logement ou le renouvellement du parc.",
    side: 'top',
    align: 'start',
  },
  {
    anchor: 'results-needs-split',
    title: 'D’où vient le besoin ?',
    description:
      "Otelo distingue les besoins liés à la démographie et à l'évolution du parc de ceux liés aux situations de mal-logement que le scénario prévoit de résorber. Ouvrez le détail pour comprendre quelle composante pèse le plus dans votre estimation.",
    side: 'top',
    align: 'start',
  },
  {
    anchor: 'results-needs-split',
    title: 'Du besoin aux logements à construire',
    description:
      'Le premier graphique montre les éléments qui génèrent un besoin ; le second les ressources que le parc existant peut apporter. Le besoin de construction neuve correspond au solde qui reste à couvrir après prise en compte de ces ressources.',
    side: 'top',
    align: 'start',
  },
  {
    anchor: 'results-existing-parc',
    title: 'Ces volumes sont déjà déduits du besoin',
    description:
      'Les logements présentés ici contribuent déjà à couvrir le besoin dans votre scénario : ne les soustrayez pas une seconde fois du nombre de constructions neuves. Ils traduisent des hypothèses de remobilisation ou de transformation du parc, pas des gains déjà acquis.',
    side: 'top',
    align: 'start',
  },
  {
    anchor: 'results-vacancy-card',
    title: 'Un potentiel de remobilisation, pas un résultat acquis',
    description:
      "Ce volume correspond au nombre de logements qui seraient remobilisés si l'objectif de vacance retenu est atteint. Otelo ne dit pas que ces logements sont déjà identifiés ni effectivement mobilisables : le scénario traduit une hypothèse de politique publique.",
    side: 'top',
    align: 'start',
  },
  {
    anchor: 'results-renewal-card',
    title: 'Renouvellement urbain : lisez le solde',
    description:
      'Le chiffre résulte de la différence entre les logements créés dans le parc existant et ceux qui en disparaissent. Il ne correspond donc pas au nombre brut de restructurations.',
    side: 'top',
    align: 'end',
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
    title: 'Regardez la trajectoire, pas seulement le total',
    description:
      'Le graphique montre comment le besoin de construction neuve évolue année par année. Un même total peut correspondre à un besoin stable, croissant ou décroissant. Cette temporalité est essentielle pour discuter un rythme de production.',
    side: 'top',
    align: 'start',
  },
  {
    anchor: 'results-annual-needs',
    title: 'Comparez avec les rythmes récents, avec prudence',
    description:
      "Les permis autorisés et les logements commencés donnent un repère sur l'activité récente, mais ils ne mesurent pas la même chose que le besoin estimé par Otelo et un décalage temporel les sépare. Ils servent à situer l'ordre de grandeur, pas à valider automatiquement le scénario.",
    side: 'top',
    align: 'start',
  },
  {
    anchor: 'results-surplus-housing',
    title: 'Des logements peuvent devenir excédentaires',
    description:
      "Dans certaines trajectoires de baisse du nombre de ménages, une partie du parc peut devenir excédentaire. Otelo quantifie ce volume sans décider de son devenir : vacance, résidence secondaire, démolition, changement d'usage ou autre réponse relèvent de la stratégie locale.",
    side: 'top',
    align: 'start',
  },
  {
    anchor: 'results-parc-evolution',
    title: "D'où vient le besoin lié au flux",
    description:
      'Le graphique décompose le besoin lié au flux : évolution du nombre de ménages, renouvellement urbain, résidences secondaires, vacance. Les postes négatifs sont ceux que le parc existant prend en charge.',
    side: 'top',
    align: 'start',
  },
  {
    anchor: 'results-epcis-details',
    title: 'Chaque EPCI est calculé séparément',
    description:
      "Chaque ligne présente le besoin de l'EPCI concerné. Il n'y a pas de compensation automatique entre EPCI : une baisse du nombre de ménages dans un EPCI ne vient pas diminuer le besoin d'un autre.",
    side: 'top',
    align: 'start',
  },
  {
    anchor: 'results-epcis-details',
    title: 'Pourquoi la période peut-elle différer entre EPCI ?',
    description:
      "La période utilisée dépend de la trajectoire de chaque EPCI. Lorsqu'un pic de ménages intervient avant l'horizon général, certaines composantes sont calculées jusqu'à cette date. Deux EPCI du même scénario peuvent donc avoir des périodes considérées différentes.",
    side: 'top',
    align: 'start',
  },
  {
    anchor: 'results-bad-housing',
    title: 'Ce chiffre n’est pas le nombre total de ménages mal logés',
    description:
      "Il correspond aux logements supplémentaires nécessaires pour résorber la part des situations de mal-logement retenue dans votre scénario, sur la période considérée. Toutes les situations observées ne génèrent pas automatiquement un logement supplémentaire. « Affiner le mal-logement » permet d'en revoir l'horizon de résorption et le périmètre.",
    side: 'top',
    align: 'start',
  },
  {
    anchor: 'results-share',
    title: 'Partager pour discuter',
    description:
      'Le lien de partage permet à un partenaire de consulter le scénario en lecture seule, sans compte Otelo et sans pouvoir le modifier. Vous pouvez désactiver cet accès à tout moment.',
    side: 'bottom',
    align: 'start',
  },
  {
    anchor: 'results-export',
    title: 'Télécharger le scénario et ses hypothèses',
    description:
      "L'export ne contient pas seulement le résultat : il reprend également le territoire, les hypothèses et des éléments de cadrage utiles pour présenter et discuter le scénario.",
    side: 'bottom',
    align: 'end',
  },
  {
    anchor: 'results-export',
    title: 'Ce qu’Otelo vous apporte — et ce qu’il vous reste à décider',
    description:
      "Otelo fournit un cadre quantitatif commun pour objectiver et comparer les besoins. Il ne choisit pas la localisation des logements, leur typologie, la répartition privé/social ni la stratégie opérationnelle : ces choix relèvent du projet de territoire et de l'expertise locale.",
    side: 'bottom',
    align: 'end',
  },
]

/**
 * Contenu du mode tuto du sous-parcours « Affiner le mal-logement ».
 *
 * Liste unique comme pour les résultats : les sept écrans partagent le même menu latéral et
 * la même mécanique de curseur de part, seule l'ancre de l'horizon de résorption n'existe
 * que sur le premier. Le filtrage au démarrage suffit donc à produire le bon parcours page
 * après page.
 */
export const BAD_HOUSING_TUTORIAL_CONTENT: TutorialStep[] = [
  {
    anchor: 'bad-housing-resorption-horizon',
    title: 'Que paramétrez-vous ici ?',
    description:
      'Vous allez préciser quelle part des situations de mal-logement observées doit générer un besoin de logement supplémentaire, et à quel rythme ce besoin doit être résorbé. Ce paramétrage complète le scénario après la première estimation.',
    side: 'bottom',
    align: 'start',
  },
  {
    anchor: 'bad-housing-resorption-horizon',
    title: 'À quel rythme souhaitez-vous résorber ces situations ?',
    description:
      "L'horizon de résorption fixe la date à laquelle les situations prises en compte sont supposées résolues. Un horizon proche augmente le rythme annuel de réponse ; un horizon plus lointain l'étale dans le temps.",
    side: 'bottom',
    align: 'start',
  },
  {
    anchor: 'bad-housing-side-menu',
    title: 'Toutes les situations de mal-logement ne se ressemblent pas',
    description:
      "Otelo distingue cinq familles de situations. Elles ne renvoient ni aux mêmes publics ni aux mêmes réponses : certaines peuvent nécessiter un logement supplémentaire, d'autres peuvent être traitées autrement, par exemple par rénovation.",
    side: 'right',
    align: 'start',
  },
  {
    anchor: 'bad-housing-part',
    title: 'Une situation observée ne devient pas automatiquement un logement à produire',
    description:
      "Le pourcentage retenu indique la part des situations considérées comme générant effectivement un besoin de logement supplémentaire. Par exemple, retenir 50 % pour la mauvaise qualité signifie que l'autre moitié est supposée pouvoir trouver une réponse sans logement supplémentaire, notamment par rénovation.",
    side: 'bottom',
    align: 'start',
  },
]
