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
  // stepper et colonne « Votre scénario », présents sur toutes les étapes du parcours
  | 'wizard-stepper'
  | 'scenario-panel'
  // choix-du-territoire
  | 'bassin-epcis'
  | 'add-epcis'
  | 'epci-group-select'
  | 'epci-search'
  | 'urbanisme-doc'
  | 'urbanisme-doc-existing-group'
  | 'epci-group-name'
  // parametrages-demographique
  | 'infographie-link'
  | 'population-select'
  | 'population-chart'
  | 'omphale-select'
  | 'omphale-chart'
  // présent dans les deux onglets de l'étape démographique
  | 'territory-chart-select'
  // taux-cibles-logements-vacants
  | 'long-term-vacancy-input'
  | 'vacancy-parc-chart'
  // taux-cibles-residences-secondaires
  | 'secondary-rate'
  // taux-restructuration-disparition
  | 'observed-rates-note'
  | 'renewal-reading-key'
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
  | 'bad-housing-stepper'
  | 'bad-housing-scenario-panel'
  | 'bad-housing-resorption-horizon'
  | 'bad-housing-part'

/** À étaler sur l'élément à mettre en avant : `<div {...tutorialAnchor('scenario-panel')}>`. */
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
  /** Année du pic de ménages de l'EPCI affiché sur les résultats, lorsqu'elle précède l'horizon. */
  peakYear?: number | null
}

const buildCreationContent = ({ millesime }: TutorialContext): Partial<Record<WizardStepSlug, TutorialStep[]>> => ({
  'choix-du-territoire': [
    {
      anchor: 'wizard-stepper',
      title: 'Construction du scénario',
      description:
        "<strong>Votre scénario se construit en 6 étapes.</strong> Vous définissez d'abord le territoire et l'horizon de projection, puis vous choisissez vos hypothèses sur la démographie et l'évolution du parc de logements. Otelo calcule ensuite les besoins à partir de l'ensemble de ces choix.",
      side: 'bottom',
      align: 'center',
    },
    {
      anchor: 'epci-search',
      title: 'Rechercher un EPCI',
      description:
        "Recherchez ici l'EPCI ou la commune sur lequel vous travaillez. Otelo identifiera automatiquement le bassin d'habitat auquel il appartient et ajoutera les autres EPCI qui le composent.",
      side: 'bottom',
      align: 'start',
    },
    {
      anchor: 'bassin-epcis',
      title: "Le bassin d'habitat, votre territoire d'étude",
      description:
        "L'estimation des besoins se fait à l'échelle du <strong>bassin d'habitat</strong> : ses EPCI sont tous retenus. Vous pourrez ensuite consulter les résultats de chacun d'eux.",
      side: 'bottom',
      align: 'start',
    },
    {
      anchor: 'add-epcis',
      title: 'Travailler sur un autre périmètre',
      description:
        "Si votre territoire d'étude déborde du bassin d'habitat, vous pouvez y ajouter des EPCI limitrophes. <strong>Cette option est utile pour travailler sur un SCoT qui s'étend sur plusieurs bassins d'habitat.</strong>",
      side: 'bottom',
      align: 'start',
    },
    {
      // Hors référentiel : sans elle, l'écran « Utiliser des territoires étudiés » n'avait aucune
      // bulle avant le choix d'un groupe, et le bouton du guide ne faisait rien.
      anchor: 'epci-group-select',
      title: "Repartir d'un territoire déjà étudié",
      description:
        "Cette option permet de <strong>réutiliser un regroupement d'EPCI précédemment créé</strong>, pour comparer plusieurs scénarios sur le même territoire sans le recomposer à chaque fois.",
      side: 'bottom',
      align: 'start',
    },
    {
      anchor: 'urbanisme-doc',
      title: "Cadre de l'estimation",
      description:
        "Indiquez si votre scénario est réalisé dans le cadre d'un document d'urbanisme. Cette information permet notamment à Otelo de mieux rattacher votre travail à son contexte et de vous proposer <strong>un nom adapté pour votre groupe d'EPCI</strong>.",
      side: 'bottom',
      align: 'start',
    },
    {
      // Hors référentiel : sur un groupe existant, le nom est déjà fixé et la réponse ne sert qu'à
      // compléter le territoire — la bulle « Cadre de l'estimation » y serait trompeuse.
      anchor: 'urbanisme-doc-existing-group',
      title: "Cadre de l'estimation",
      description:
        "Indiquez si ce scénario s'inscrit dans un document d'urbanisme. Cette information est facultative : elle sera <strong>ajoutée à votre territoire</strong> et ne vous sera plus demandée pour ses prochains scénarios.",
      side: 'bottom',
      align: 'start',
    },
    {
      anchor: 'epci-group-name',
      title: 'Attribuer un nom au territoire',
      description:
        "Nommez ce territoire de façon à pouvoir le retrouver dans l'onglet « Tableau de bord », et le réutiliser pour de futurs scénarios.",
      side: 'top',
      align: 'start',
    },
  ],

  // Les deux onglets partagent le sélecteur « Territoire affiché » : `visibleWith` choisit la
  // bulle de l'onglet ouvert, chacun ne montant que son propre sélecteur de scénario.
  'parametrages-demographique': [
    {
      anchor: 'infographie-link',
      visibleWith: 'population-select',
      title: 'Mieux comprendre la dynamique du territoire',
      description:
        "<strong>L'Infographie peut être utile tout au long du parcours Otelo.</strong> Elle rassemble des données de cadrage sur les évolutions passées de votre territoire et peut vous aider à approfondir votre lecture si une projection vous surprend ou si vous souhaitez la confronter à des tendances plus anciennes.",
      side: 'top',
      align: 'start',
    },
    {
      anchor: 'population-chart',
      title: 'Comparer les trajectoires projetées',
      description:
        "Le graphique met en regard <strong>l'évolution récente de la population et les trois trajectoires projetées</strong>. Il permet de voir si une projection prolonge la tendance passée, la ralentit ou marque une rupture. Un scénario « bas » ne signifie donc pas nécessairement une baisse de population. Le scénario central, lui, n'est pas toujours un simple prolongement de la tendance récente.",
      side: 'top',
      align: 'center',
    },
    {
      anchor: 'territory-chart-select',
      visibleWith: 'population-select',
      title: 'Un choix pour tout le territoire, une lecture EPCI par EPCI',
      description:
        "Vous pouvez afficher le graphique pour chaque EPCI ou pour l'ensemble du territoire afin de comparer leurs trajectoires. <strong>Le scénario de population que vous sélectionnez s'applique toutefois à l'ensemble des EPCI de votre étude.</strong> Changer le territoire affiché ne change donc pas votre paramétrage.",
      side: 'left',
      align: 'start',
    },
    {
      anchor: 'omphale-chart',
      title: 'Comparer les trajectoires projetées',
      description:
        "Le graphique met en regard <strong>l'évolution récente du nombre de ménages et les trois trajectoires projetées</strong>. Il permet de voir si une projection prolonge la tendance passée, la ralentit ou marque une rupture.",
      side: 'top',
      align: 'center',
    },
    {
      anchor: 'territory-chart-select',
      visibleWith: 'omphale-select',
      title: 'Un choix pour tout le territoire, une lecture EPCI par EPCI',
      description:
        "Vous pouvez afficher le graphique pour chaque EPCI ou pour l'ensemble du territoire afin de comparer leurs trajectoires. <strong>Le scénario d'évolution des ménages que vous sélectionnez s'applique toutefois à l'ensemble des EPCI de votre étude.</strong>",
      side: 'left',
      align: 'start',
    },
  ],

  'taux-cibles-logements-vacants': [
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
      title: 'Effets sur les besoins en logements',
      description:
        "Réduire la vacance de longue durée revient à supposer qu'une partie de ces logements pourra redevenir disponible, notamment comme résidence principale. <strong>Plus la réduction retenue est importante, plus le parc existant couvre une partie du besoin en logements, et moins la construction neuve sera élevée.</strong> Attention : vous réduisez ici le <strong>taux</strong> de vacance. Par exemple, réduire de 15 % un taux de 2 % conduit à un taux cible de <strong>1,7 %</strong>.",
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
  ],

  'taux-cibles-residences-secondaires': [
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
      title: 'Effets sur les besoins en logements',
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
  ],

  'taux-restructuration-disparition': [
    {
      anchor: 'observed-rates-note',
      title: 'À noter',
      description: `Otelo prolonge par défaut les <strong>taux annuels observés entre ${getObservedRatesPeriodLabel(millesime)}</strong>. Vérifiez qu'ils correspondent bien à ce que vous anticipez. Par exemple, si cette période comprend une importante opération ponctuelle de démolition, reconduire ce rythme chaque année jusqu'à l'horizon peut fortement surestimer les disparitions futures.`,
      side: 'bottom',
      align: 'start',
    },
    {
      anchor: 'renewal-reading-key',
      title: 'Effets sur les besoins en logements',
      description:
        'Otelo met en balance les logements créés par restructuration et ceux qui disparaissent. <strong>Si les créations sont supérieures aux disparitions, le besoin à produire diminue ; si les disparitions sont supérieures, il augmente.</strong> La clé de lecture traduit directement ce solde en logements par an.',
      side: 'top',
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
    anchor: 'bad-housing-stepper',
    title: 'Toutes les situations de mal-logement ne se ressemblent pas',
    description:
      "Otelo distingue cinq familles de situations. Elles ne renvoient ni aux mêmes publics ni aux mêmes réponses : certaines peuvent nécessiter un logement supplémentaire, d'autres peuvent être traitées autrement, par exemple par rénovation.",
    side: 'bottom',
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
