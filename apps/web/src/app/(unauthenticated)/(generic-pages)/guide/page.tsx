import { Table } from '@codegouvfr/react-dsfr/Table'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: "Guide d'utilisation Otelo",
}

export default function GuidePage() {
  return (
    <>
      <h1>Guide d'utilisation - Otelo</h1>
      <h2 id="quest-ce-qu-otelo">🏠 Qu'est-ce qu'Otelo ?</h2>
      <p>
        Otelo est un <span className="fr-text--bold">outil d'aide à la décision</span> qui permet d'analyser et de projeter les{' '}
        <span className="fr-text--bold">besoins en logements</span> de votre territoire. Il vous aide à comprendre et quantifier les
        différents facteurs (démographiques, liés au mal-logement, issus de l'évolution du parc de logements) qui impactent ces besoins et à
        prendre des décisions éclairées en matière d'aménagement du territoire pour faire advenir les scénarios les plus souhaitables.
      </p>
      <h3 id="les-echelles-geographiques">Les échelles géographiques</h3>
      <p>Otelo vous permet de travailler à deux échelles selon vos besoins :</p>
      <h4 id="epci">🏛️ L'EPCI</h4>
      <p>
        <strong>Qu'est-ce que c'est ?</strong> EPCI signifie "Établissement Public de Coopération Intercommunale". Ce sont des regroupements
        de communes qui travaillent ensemble sur des projets communs (ex: communautés de communes, communautés d'agglomération, métropoles).
      </p>
      <p>
        <strong>Pourquoi utiliser cette échelle ?</strong>
      </p>
      <ul className="fr-mb-4w">
        <li>Pour respecter les périmètres administratifs des documents d'urbanisme</li>
        <li>Pour coordonner les politiques publiques entre communes</li>
        <li>Pour estimer le besoin à une échelle opérationnelle d'action publique</li>
      </ul>
      <h4 id="bassins-habitat">🏘️ Les bassins d'habitat</h4>
      <p>
        <strong>Qu'est-ce que c'est ?</strong> Un bassin d'habitat est un <span className="fr-text--bold">regroupement d'EPCI</span> qui
        s'efforce de correspondre à une aire de marché du logement cohérente, une zone géographique où les habitants vivent et travaillent
        au quotidien, et où ils effectuent leur parcours résidentiel. C'est un territoire qui se veut cohérent du point de vue des
        déplacements domicile-travail et des services utilisés par les habitants.
      </p>
      <p>
        Les bassins d'habitat sont construits de manière à compter au moins 50 000 habitants, seuil nécessaire pour disposer de projections
        démographiques jugées robustes par l'INSEE.
      </p>
      <p>
        <strong>Pourquoi utiliser cette échelle ?</strong>
      </p>
      <ul className="fr-mb-4w">
        <li>
          Pour questionner les relations entre les différents EPCI d'un même bassin d'habitat, en matière d'attractivité, de complémentarité
          ou de concurrence, d'équilibre territorial.
        </li>
        <li>Pour éviter de raisonner à l'échelle d'un EPCI sans tenir compte des dynamiques et des besoins des espaces limitrophes.</li>
      </ul>
      <h3 id="elements-cadrage">Les éléments de cadrage</h3>
      <h4 id="donnees-demarrer">Les données pour démarrer : </h4>
      <ul>
        <li>
          Le <span className="fr-text--bold">nombre de logements</span> du territoire au 1er janvier 2021
        </li>
        <li>
          Le <span className="fr-text--bold">taux de vacance</span> au 1er janvier 2021, en distinguant vacance de courte durée (moins de 2
          ans) et vacance de <span className="fr-text--bold">longue durée</span> (2 ans ou plus).
        </li>
        <li>
          Le <span className="fr-text--bold">taux de résidences secondaires</span> au 1er janvier 2021
        </li>
        <li>
          Des <span className="fr-text--bold">projections démographiques</span> permettant de définir un nombre de ménages sur le territoire
          pour chaque année entre 2021 et 2050
        </li>
        <li>
          Des données permettant d'estimer le <span className="fr-text--bold">volume de situations de mal-logement</span> et de{' '}
          <span className="fr-text--bold">hors logement</span> sur le territoire
        </li>
      </ul>
      <p>
        NB : l'année de référence est fixée à <span className="fr-text--bold">2021</span> compte-tenu des données les plus récentes
        disponibles (recensement, données fiscales…). A chaque mise à jour des données, cette année de référence est susceptible d'évoluer.
      </p>
      <h4 id="hypotheses-utilisateur">Hypothèses de l'utilisateur</h4>
      <h5 id="hypotheses-calcul-incontournables">Des hypothèses de calcul incontournables</h5>
      <ul>
        <li>
          Choisir un <span className="fr-text--bold">horizon de projection</span> : à quelle date souhaite-t-on estimer le besoin en
          logement
        </li>
        <li>Choisir un scénario de projection en population, puis en nombre de ménages</li>
        <li>Définir une évolution du taux de vacance de longue durée entre 2021 et l'horizon de projection</li>
        <li>Définir une évolution du taux de résidences secondaires entre 2021 et l'horizon de projection</li>
      </ul>
      <p>Pour aller plus loin : </p>
      <ul className="fr-mb-4w">
        <li>Définir l'impact des restructurations sur le besoin en logement</li>
        <li>Affiner la prise en compte des différentes composantes du mal-logement et du hors logement dans le calcul du besoin</li>
      </ul>
      <h3 id="fonctionnement-methode">Le fonctionnement de la méthode de calcul</h3>
      <h4 id="utilisateur-choisi">Ce que l'utilisateur choisi :</h4>
      <ul className="fr-mb-4w">
        <li>Territoire</li>
        <li>Horizon de projection (ex. 2050)</li>
        <li>Scénario démographique en ménages</li>
        <li>Taux de vacance de longue durée cible à l'horizon</li>
        <li>Taux de résidences secondaires cible à l'horizon</li>
        <li>Déficit en résidences principales à résorber (= mal-logement) et année de résorption visée</li>
        <li>Taux annuels de disparition & de restructuration</li>
      </ul>
      <h4 id="otelo-fait">Ce que fait Otelo :</h4>
      <ol>
        <li>
          Évalue pour chaque année de la période de projection les ménages supplémentaires à accueillir par rapport à l'année précédente,
          selon le scénario démographique choisi. (A)
        </li>
        <li>
          Ajoute le nombre de résidences supplémentaires à ajouter pour résorber chaque année, jusqu'à l'horizon de résorption retenu, une
          partie du mal-logement du territoire
        </li>
        <li>
          Détermine l'« année du maximum » (C) sur la trajectoire projetée : c'est l'année où le besoin en résidences principales est le
          plus élevé.
          <ul>
            <li>
              Cette année joue un rôle de borne : au-delà du pic, OTELO n'intensifie plus la remobilisation ; les taux cibles de vacance et
              de résidences secondaires restent stables.
            </li>
          </ul>
        </li>
        <li>
          Projette les taux choisis de vacance de longue durée (txVL) et de résidences secondaires (txRs) jusqu’à l’année de projection (ou
          « l’année du maximum ») :
          <ul>
            <li>
              évolution linéaire depuis 2021 jusqu’au taux cible atteint à l’horizon de projection ou à l’année du maximum (C) si celle-ci
              lui est antérieure;
            </li>
            <li>vacance courte supposée stable (txVC); </li>
          </ul>
        </li>
        <p className="fr-my-2w">Puis, pour chaque année jusqu'à l'horizon de projection, Otelo réalise les opérations suivantes :</p>
        <li>
          Calibre le parc total requis pour loger les ménages supplémentaires en respectant les parts cibles :
          <ul>
            <li>Parc total requis ≈ résidences principales nécessaires / (1 − txVC − txVL − txRS) </li>
            <li>
              Otelo en déduit le volume de logements vacants (dont courte/longue) et de résidences secondaires correspondant à ces taux.{' '}
            </li>
            <li>
              Si l'un de ces volumes est inférieur à sa valeur 2021, Otelo anticipe une remobilisation (transformation en résidences
              principales).
            </li>
          </ul>
        </li>
        <li>
          Applique l'effet des restructurations du parc :
          <ul>
            <li>disparitions (ex. démolitions, changements d'usage)</li>
            <li>apparitions par restructuration (ex. divisions/fusions)</li>
          </ul>
        </li>
        <p>
          L’outil calcule un solde (E) entre ces deux flux de restructuration à compenser (si positif) ou qui minore le besoin (si négatif).
        </p>
        <li>
          Produit le besoin total de l'année :
          <ul>
            <li>besoin lié aux résidences principales (ménages + rattrapage)</li>
            <li>ajusté des volumes à prévoir pour vacants et résidences secondaires</li>
            <li>diminué ou augmenté du solde lié au renouvellement urbain</li>
            <li>Si le résultat est positif : logements à produire.</li>
          </ul>
        </li>
      </ol>
      <p>
        Cas particulier traité par OTELO : si le besoin en résidences principales de l’année est nul ou négatif, l’outil n’active pas de
        remobilisation supplémentaire (les taux de vacance et de résidences secondaires sont maintenus à leur niveau de 2021 pour cette
        année-là). Un volume de logements excédentaires est alors mis en évidence dans les résultats.
      </p>
      <h4 id="resultats-otelo">Les résultats fournis par Otelo</h4>
      <p>Pour chaque EPCI et chaque année simulée, Otelo restitue :</p>
      <ul className="fr-mb-4w">
        <li>le besoin total de logements à produire,</li>
        <li>la décomposition (ménages + mal-logements / vacants / résidences secondaires / restructurations),</li>
        <li>
          si le besoin total de logements à produire est négatif pour une année, alors un volume de logements excédentaire est calculé, dont
          le devenir n’est pas arbitré (alimentation du parc vacant, transformation en résidence secondaire, démolition, changement
          d’usage…)
        </li>
      </ul>
      <hr />
      <h2 id="briques-besoin-logements">Les briques du besoin en logements</h2>
      <h3 id="projections-demographiques">📊 Projections démographiques</h3>
      <p>
        Cette section vous permet de visualiser comment la population et le nombre de ménages de votre territoire vont évoluer dans les
        années à venir.
      </p>
      <p>
        <strong>Ce que vous pouvez analyser :</strong>
      </p>
      <ul>
        <li>
          👥 <strong>Évolution du nombre d'habitants</strong> : augmentation ou diminution de la population
        </li>
        <li>
          🏠 <strong>Évolution du nombre de ménages</strong> : nombre de foyers/logements nécessaires
        </li>
        <li>
          👶👴 <strong>Structure par âge</strong> : répartition entre jeunes, actifs et seniors
        </li>
        <li>
          📈 <strong>Tendances sur 10-20 ans</strong> : projections à moyen et long terme
        </li>
      </ul>
      <p>
        <strong>Pourquoi c'est important ?</strong> Ces projections vous aident à :
      </p>
      <ul className="fr-mb-4w">
        <li>Planifier la construction de nouveaux logements</li>
        <li>Adapter les équipements publics (écoles, crèches, maisons de retraite)</li>
        <li>Prévoir les besoins en transport et services</li>
        <li>Anticiper les évolutions économiques du territoire</li>
      </ul>
      <h4 id="elaboration-projections">🧠 Comprendre comment sont élaborées les projections démographiques</h4>
      <p>
        Otelo vous propose des projections du <strong>nombre de ménages</strong> jusqu'en 2050, construites à partir des{' '}
        <strong>projections de population de l'Insee</strong> (modèle <strong>Omphale</strong>) et d'une méthode développée avec l'
        <strong>Insee</strong> et le <strong>SDES</strong>, pour obtenir un nombre de ménages.
        <br />
        Cette méthode tient compte de l'évolution des comportements de vie (cohabitation, décohabitation, etc.).
      </p>
      <p>
        🗺️ <strong>Quels territoires sont couverts ?</strong>
      </p>
      <ul className="fr-mb-4w">
        <li>
          <strong>EPCI de plus de 50 000 habitants</strong> : projection fournie directement par l'Insee via le modèle Omphale.
        </li>
        <li>
          <strong>EPCI de moins de 50 000 habitants</strong> (soit 79 % des EPCI en 2023) : projection calculée à partir d'un territoire
          plus large.
        </li>
      </ul>
      <p>
        🔄 <strong>Méthode utilisée selon les cas</strong>
      </p>
      <h5 id="cas-general-bassin-habitat">Cas général : à partir du bassin d'habitat</h5>
      <ul className="fr-mb-4w">
        <li>
          Si aucun EPCI du bassin n'a de projection propre : la projection du bassin est répartie entre les EPCI au prorata du nombre de
          ménages en 2021.
        </li>
        <li>
          Si un ou plusieurs EPCI ont une projection propre : ils la conservent ; les autres partagent le reste de la projection du bassin.{' '}
          <em>Pour en savoir plus sur la ventilation des projections ⇒ Section Ventilation.</em>
        </li>
      </ul>
      <h5 id="cas-particulier-departement">Cas particulier : à partir du département</h5>
      <p>
        35 bassins d'habitat ont été identifiés par l'INSEE comme ayant des projections jugées non robustes. Pour ces bassins, une méthode
        alternative a été adoptée pour proposer tout-de-même des projections aux utilisateurs d'Otelo, qui seront signalées comme n'étant
        pas issues directement d'une application d'Omphale sur le territoire.
      </p>
      <p>
        Dans ce cas, Otelo utilise une <strong>projection départementale</strong>, ventilée entre les EPCI selon leur poids en ménages. Si
        un EPCI est présent dans plusieurs départements, la répartition est ajustée proportionnellement au poids en ménages de l'EPCI dans
        chaque département.
      </p>
      <h4 id="projections-population">📊 Les projections de population dans Otelo</h4>
      <p>
        Otelo s'appuie sur les projections démographiques Omphale de l'Insee, un modèle de référence qui simule l'évolution de la population
        selon différentes hypothèses de natalité, de mortalité et de migration.
      </p>
      <p>
        <strong>🧭 Les scénarios de population dans Otelo</strong>
      </p>
      <p>
        Otelo propose trois scénarios démographiques, élaborés par l'Insee dans le modèle Omphale. Chaque scénario repose sur des hypothèses
        différentes de fécondité, de mortalité et de migration :
      </p>
      <Table
        caption="Scénarios démographiques Omphale"
        headers={['Scénario', 'Central', 'Population Haute', 'Population Basse']}
        data={[
          ['Fécondité', 'ICF stable à 1,8 dès 2023', 'ICF stable à 2,0 dès 2023', 'ICF stable à 1,6 dès 2023'],
          [
            'Espérance de vie',
            'Femmes : 90,0 ans / Hommes : 87,6',
            'Femmes : 93,5 ans / Hommes : 91,0',
            'Femmes : 86,5 ans / Hommes : 84,0',
          ],
          ['Migration (étranger)', 'Solde stable à +70 000/an', 'Solde à +120 000/an', 'Solde à +20 000/an'],
        ]}
        noScroll
      />
      <p>
        Les migrations entre zones françaises (ex. d'une région à une autre) sont considérées comme constantes dans tous les scénarios. Cela
        signifie qu'à l'échelle locale, Otelo prolonge les tendances passées.
      </p>
      <p>
        Vous pouvez consulter le solde naturel et le solde migratoire de votre territoire jusqu'en 2021 via les dossiers complets
        disponibles sur&nbsp;
        <a
          href="https://www.insee.fr"
          target="_blank"
          rel="noopener noreferrer"
          className="fr-link"
          aria-label="Site insee.fr (nouvelle fenêtre)"
        >
          insee.fr
        </a>
        .
      </p>
      <h4 id="projections-menages">🧮 Les projections de ménages : les scénarios de décohabitation</h4>
      <p>
        Les projections de ménages tiennent compte des <strong>changements dans les modes de vie</strong> : vivre seul, en couple, en
        famille, en structure collective…
      </p>
      <p>
        Otelo propose <strong>3 scénarios</strong> provenant d'une méthode conçue par l'Insee et le SDES basés sur l'analyse des
        recensements 2008 et 2018 :
      </p>
      <Table
        caption="Scénarios de décohabitation"
        headers={['Scénario', 'Hypothèse principale']}
        data={[
          ['🟢 Tendanciel', "Prolonge les évolutions récentes jusqu'en 2030, puis ralentit jusqu'en 2050"],
          [
            '🔺 Accélération',
            'Décohabitation plus rapide (plus de jeunes seuls, moins de vie en couple, départ plus tardif en structure collective)',
          ],
          ['🔻 Décélération', 'Décohabitation plus lente (plus de vie en couple, plus de cohabitation intergénérationnelle, etc.)'],
        ]}
        noScroll
      />
      <p>
        Ces scénarios influencent directement <strong>le nombre de logements à prévoir</strong> pour un même niveau de population. Plus la
        décohabitation est forte, plus il faut de logements.
      </p>
      <h4 id="ventilation-projections">🔍 Ventilation des projections : une méthode reflétant les dynamiques locales</h4>
      <p>
        Lorsque les EPCI n'ont pas de projection de ménages propre, Otelo estime leur évolution démographique à partir de celle du bassin
        d'habitat.
      </p>
      <h5 id="methode-repartition-dynamique">🔁 Une méthode de répartition dynamique</h5>
      <p>
        Pour mieux coller aux réalités locales, le <strong>CEREMA</strong> et la <strong>DHUP</strong> ont mis en place une{' '}
        <strong>clé de répartition évolutive</strong> :
      </p>
      <ul className="fr-mb-4w">
        <li>
          Elle démarre en 2021 à partir de la part réelle de chaque EPCI dans le bassin, selon le nombre de <strong>ménages</strong> ou de{' '}
          <strong>personnes vivant en ménage</strong>, selon le type de projection.
        </li>
        <li>
          Elle est ajustée chaque année en suivant la <strong>tendance observée entre 2015 et 2021</strong>.
        </li>
      </ul>
      <p>📆 Deux périodes différentes :</p>
      <ul className="fr-mb-4w">
        <li>2022–2030 : La tendance récente est appliquée chaque année.</li>
        <li>2031–2050 : La même tendance est ralentie (divisée par 2).</li>
      </ul>
      <h5 id="precision-methode">🔍 Précision sur cette méthode</h5>
      <ul className="fr-mb-4w">
        <li>
          Un <strong>EPCI en croissance</strong> continue à gagner du poids dans la projection.
        </li>
        <li>
          Un <strong>territoire en déclin</strong> peut voir sa part diminuer, même si son bassin est globalement en hausse.
        </li>
        <li>
          Résultat : chaque EPCI d'un même bassin peut atteindre son <strong>pic de population ou de ménages</strong> à des moments
          différents.
        </li>
      </ul>
      <h5 id="illustration-simplifiee">🧮 Illustration simplifiée</h5>
      <p>Un bassin de 25 000 ménages en 2021, avec 3 EPCI :</p>
      <Table
        caption="Répartition des ménages par EPCI en 2021"
        headers={['EPCI', 'Ménages en 2021', 'Part initiale']}
        data={[
          ['EPCI A', '12 500', '50 %'],
          ['EPCI B', '8 250', '33 %'],
          ['EPCI C', '4 250', '17 %'],
        ]}
        noScroll
        fixed
      />
      <p>📈 Tendance observée entre 2015 et 2021 :</p>
      <ul className="fr-mb-4w">
        <li>EPCI A : en légère baisse de 0.1 point / an</li>
        <li>EPCI B : stable</li>
        <li>EPCI C : en progression de 0.1 point / an</li>
      </ul>
      <p>📊 Résultat avec la nouvelle méthode :</p>
      <ul>
        <li>
          En <strong>2030</strong> :
          <ul>
            <li>
              EPCI A descend à <strong>49,1 %</strong>
            </li>
            <li>
              EPCI C monte à <strong>17,9 %</strong>
            </li>
          </ul>
        </li>
        <li>
          En <strong>2050</strong> :
          <ul>
            <li>
              EPCI A descend à <strong>48,1 %</strong>
            </li>
            <li>
              EPCI C monte à <strong>18,9 %</strong>
            </li>
          </ul>
        </li>
      </ul>
      <p>
        ⚠️ <strong>Point important</strong>
        <br />
        La <strong>même logique s'applique aux projections de population</strong>.
      </p>
      <h3 id="donnees-parc-logement">📊 Les données sur le parc de logement</h3>
      <h3 id="situations-mal-logement">🎯 Les situations de mal-logement et de hors-logement</h3>
      <p>
        Otelo vous permet d'estimer un volume de situations de mal-logement et de hors logement, qui sont susceptibles de conclure à un
        déficit actuel de logements sur le territoire. Dans ce cas, au besoin en logements à produire pour faire face aux évolutions du parc
        et aux évolutions démographiques, s'ajoute un besoin pour résorber ce déficit de départ.
      </p>
      <h2 id="horizon-resorption">Horizon de résorption</h2>
      <p>
        L'horizon de résorption correspond à l'année à laquelle l'utilisateur estime que ce déficit actuel en logements sera résorbé, à un
        rythme annuel constant. Par défaut, il est fixé à 2050. Dans ce cas, pour un déficit estimé à 1000, le besoin annuel sera de 1000 /
        (2050 – 2021) = 34,5 logements par an. Cet horizon de résorption est à définir au début du paramétrage relatif au hors logement et
        au mal-logement.
      </p>
      <p>
        L'horizon de résorption ne doit pas être confondu avec l'horizon de projection, qui est la date à laquelle l'utilisateur souhaite
        réaliser son estimation.
      </p>
      <p>Ces deux horizons peuvent interagir de différentes manières :</p>
      <ul className="fr-mb-4w">
        <li>
          Si on choisit un horizon de résorption égal à l'horizon de projection, alors le besoin annuel en nouveaux logements sera constant
          sur la période et le besoin lié au déficit actuel sera complètement résorbé à l'issue de la période de projection.
        </li>
        <li>
          Si on choisit un horizon de résorption plus élevé que l'horizon de projection, alors le déficit actuel ne sera que partiellement
          résorbé à l'issue de la période de projection.
        </li>
        <li>
          Si on choisit un horizon de résorption plus faible que l'horizon de projection, alors le besoin en logements sera moindre une fois
          l'horizon de résorption atteint, car il ne s'agira alors plus que de répondre au besoin lié aux évolutions démographiques et à
          celles du parc.
        </li>
      </ul>
      <h2 id="hors-logement">Hors-logement</h2>
      <p>
        Il s'agit ici de comptabiliser les personnes dites « sans domicile » : Les personnes sans-abris, en habitations de fortune ou logées
        à l'hôtel ; Les personnes accueillies dans les structures d'hébergement social.
      </p>
      <h3 id="sans-abris-habitations-fortune">Sans-abris, habitations de fortune et logés à l'hôtel</h3>
      <p>
        Le paramétrage proposé est un choix entre deux sources, le recensement de l'INSEE ou le Système National d'Enregistrement (SNE)
        fourni par le MTE.
      </p>
      <ul>
        <li>
          L'INSEE identifie les sans-abris par zone d'emploi via le fichier détail « Individus » du recensement : à chaque individu
          correspond un ménage potentiel par défaut. Les ménages logés dans des habitations de fortune et dans des chambres d'hôtel sont
          recensés dans le fichier détail « Logements ».
        </li>
        <li>
          Le Système National d'Enregistrement (SNE) indique directement le nombre de ménages demandant un logement social et déclarant les
          modes de logement actuels suivants : « Sans-abri ou habitat de fortune », « Dans un squat », « Camping, caravaning » et « Logé
          dans un hôtel ». Les ménages sont localisés sur le territoire souhaité par le demandeur et non sur son lieu de résidence.
        </li>
      </ul>
      <p>Par défaut, c'est le recensement qui est privilégié.</p>
      <h3 id="hebergement-social">Hébergement social</h3>
      <p>
        Le répertoire FINESS permet de connaître la capacité d'accueil en nombre de places des établissements d'hébergement social.
        L'enquête Établissements et services (ES) « difficulté sociale » dont les résultats sont publiés sur le site de la Direction de la
        recherche, des études, de l'évaluation et des statistiques (Drees), mesure en complément les ratios d'occupation par type
        d'établissement, ce qui permet d'estimer un taux d'occupation moyen.
      </p>
      <ul className="fr-mb-4w">
        <li>
          Choisir les structures qu’il souhaite prendre en compte. Par défaut, sont retenues les structures suivantes sont prises en compte
          : centres d’hébergement et de réinsertion sociale (CHRS), centres d’accueil des demandeurs d’asile, centre provisoire
          d’hébergement et autre centre d’accueil. Pour plus de précisions sur les différents types de structures susceptibles d’être prises
          en compte, voir notamment le Guide des dispositifs d’hébergement et de logement adapté.
        </li>
        <li>
          Définir la part de ces situations qui seront prises en compte, comprise entre 0 et 100% (elle est par défaut fixée à 50%). En
          effet, on peut estimer qu’une part plus ou moins importante des ménages hébergés aurait besoin d’un nouveau logement. Plus la part
          fixée est élevée, plus le volume de besoin en logements associé sera élevé.Notons que les données FINESS ne permettent pas de
          connaître la forme des ménages potentiels qui seront constitués par les personnes hébergées. L’outil considère qu’il s’agit de
          ménages potentiels d’une personne ce qui peut induire une légère surestimation du besoin.{' '}
        </li>
      </ul>
      <h2 id="heberges">Hébergés</h2>
      <p>
        Les personnes vivant dans un logement qui n'est pas le leur sont définies comme étant les personnes se trouvant en situation de
        cohabitation subie. Elles sont regroupées en deux catégories :
      </p>
      <ul className="fr-mb-4w">
        <li>Les personnes logées chez un parent ou un enfant (cohabitation intergénérationnelle présumée subie)</li>
        <li>Les personnes hébergées chez un tiers sans lien de parenté direct</li>
      </ul>
      <h3 id="cohabitation-intergenerationnelle">Cohabitation intergénérationnelle présumée subie</h3>
      <p>
        La cohabitation chez un parent peut être choisie et se dérouler dans de bonnes conditions. Mais elle peut aussi être subie et
        relever du mal-logement, ce qui justifierait de la décompter dans les besoins non satisfaits. Otelo permet à l'utilisateur
        d'identifier des situations de cohabitation intergénérationnelle présumée subie et de définir la part de ces situations qui sont
        susceptibles de générer un besoin en logements.
      </p>
      <p className="fr-text--bold">→ Une mesure de la cohabitation intergénérationnelle présumée subie</p>
      <p>
        Otelo reprend les chiffres d’une publication du CGDD/SDES et visant à mesurer et territorialiser les situations de cohabitation
        intergénérationnelles présumées subies. La méthode mobilise une source statistique d’origine fiscale et repose sur l’existence, au
        sein de certains ménages, de plusieurs foyers fiscaux. D’abord, la population des enfants majeurs hébergés chez leurs parents est
        estimée en utilisant les différences d’âge entre la personne de référence du foyer fiscal principal et celle de chaque foyer fiscal
        rattaché . En effet, on rencontre principalement plusieurs types de cohabitation qui conduisent à l’existence de plusieurs foyers
        fiscaux au sein d’un même ménage fiscal :
      </p>
      <ul>
        <li>Des situations de cohabitation de parents chez leurs enfants,</li>
        <li>Des situations de concubinage ou de colocation,</li>
        <li>Des situations de cohabitation d’enfants chez leurs parents,</li>
        <li>Des situations d’hébergement chez des tiers.</li>
      </ul>
      <p>
        Pour isoler les situations d’enfants majeurs hébergés chez leurs parents, une différence d’âge d’au moins 18 ans entre la personne
        de référence du foyer principal et la personne de référence du foyer rattaché est appliquée. De manière normative, ne sont pris en
        compte que les situations de cohabitation intergénérationnelle affectant un jeune de plus de 25 ans (âge de la personne de référence
        du foyer rattaché). Enfin, pour apprécier la dimension de contrainte financière, la méthode considère qu’un foyer logé sous le même
        toit qu’un autre foyer se trouve dans cette situation en raison de difficultés financières dès lors que, compte tenu de ses revenus,
        il serait pauvre s’il déménageait pour prendre un logement à son compte. Le critère de pauvreté retenu consiste en un niveau de vie
        inférieur à 60% du niveau de vie médian observé pour tous les ménages. La possibilité que la contrainte financière affecte le foyer
        plus âgé et non nécessairement le plus jeune est également envisagée. Aux foyers dénombrés, on ajoute ainsi ceux dont le départ du
        logement placerait le reste des occupants en situation de pauvreté.
      </p>
      <p className="fr-text--bold">→ Définir la part de ces situations susceptible de générer un besoin en logements</p>
      <p>
        Toutes les situations de cohabitation intergénérationnelle présumée subie telles que définies ci-dessus ne génèrent pas un besoin en
        logements :
      </p>
      <ul>
        <li>Certaines situations de cohabitations présumées subies peuvent relever en réalité d’un choix</li>
        <li>
          Surtout, un jeune cohabitant chez ses parents ne va pas nécessairement décohabiter seul dans un logement. Il pourra opter pour une
          colocation, ou habiter avec quelqu’un qui dispose déjà d’un logement, voire cohabiter avec un autre jeune cohabitant.
        </li>
      </ul>
      <p>
        Considérer qu’à une situation de cohabitation intergénérationnelle présumée subie correspond un besoin en logements conduit donc à
        surestimer sensiblement le besoin.
      </p>
      <p>
        Enfin, il faut noter que les revenus calculés par le CGDD/SDES à partir de données fiscales sont des revenus fiscaux qui ne prennent
        pas en compte les aides sociales (RSA, aides au logement, allocations familiales, etc.). Certains rattachés ou ménages considérés
        comme pauvres ne le seraient pas forcément si ces aides étaient incluses dans les revenus. Cela peut induire à surestimer le volume
        des ménages en situation de cohabitation présumée subie. Pour toutes ces raisons, l’utilisateur est invité à définir la part des
        situations de cohabitation intergénérationnelle présumée subie qui induiront un besoin en logements. Ce paramètre est fixé par
        défaut à 30%. La population des cohabitants chez leurs parents étant particulièrement mobile, un élément d’éclairage du choix de
        paramétrage pourra être la probabilité que le jeune décohabite sur le territoire étudié. Ainsi, la présence ou non d’une université,
        le solde migratoire des jeunes, ou encore l’existence d’une offre locative privée sont des facteurs susceptibles d’aider à fixer ce
        paramètre.
      </p>
      <h3 id="heberges-chez-tiers">Hébergés chez un tiers</h3>
      <p>
        La source utilisée ici est le Système National d'Enregistrement (SNE), qui permet d'identifier plusieurs situations de cohabitation
        subie :
      </p>
      <ul>
        <li>Les personnes hébergées chez un particulier</li>
        <li>Les personnes logées à titre gratuit</li>
        <li>Les sous-locataires ou personnes hébergées dans un logement à titre temporaire</li>
      </ul>
      <hr />

      <h2 id="mal-logement">Mal-logement</h2>
      <p>Trois situations de mal-logement peuvent être estimées dans Otelo :</p>
      <ul>
        <li>Les situations de dépense excessive en logement</li>
        <li>Les situations de logement dégradé</li>
        <li>Les situations de sur-occupation</li>
      </ul>
      <p>
        D'autres situations de mal-logement peuvent exister (confort d'été ou d'hiver par exemple) mais elles ne sont pas pour l'instant
        prises en compte.
      </p>
      <h3 id="depense-excessive-logement">Dépense excessive en logement</h3>
      <p>
        Ces situations se définissent comme les ménages qui occupent un logement au sein du parc privé et dont le coût se révèle inadapté
        aux ressources dont ils disposent. Les ménages en situation de besoin sont ceux dont le taux d'effort net des aides au logement est
        supérieur au seuil maximal acceptable fixé par l'évaluateur. Le volume de ménages en situation d'inadéquation financière sera
        d'autant plus élevé que le taux d'effort maximal sera faible. Il est usuel de considérer un seuil de 30%.
      </p>
      <p>
        Pour mémoire, le taux d’effort correspond à la proportion du revenu d’un ménage qu’il consacre à se loger. Un ménage percevant 1500
        euros par mois et payant 600 euros de loyer, recevant en outre 100 euros d’allocations logement (AL), aura un taux d’effort net d’AL
        de (600 − 100) / 1500 = 33,3%
      </p>
      <p>
        Le taux d’effort est mesuré à l’aide des données des allocataires des aides au logement de la CNAF. L’outil permet de choisir le ou
        les statuts d’occupation pris en considération pour l’évaluation de ce besoin lié à l’inadéquation financière.
      </p>
      <p>
        Après avoir défini le taux d’effort à partir duquel il estime que la dépense en logement est excessive et les statuts d’occupation
        qu’il souhaite prendre en compte, l’utilisateur doit fixer la part de logements « réalloués ». En effet, seule une frange
        potentiellement limitée de ces situations a vocation à générer un besoin en logement supplémentaire. Une large part d’entre eux
        peuvent être alloués à un ménage disposant de revenus plus élevés, ou voir leur loyer réduit. Si ces situations relèvent bien du
        mal-logement les résorber n’implique pas forcément (ni prioritairement) de construire un nouveau logement mais d’autres leviers
        peuvent être envisagés. D’où l’importance pour l’utilisateur de fixer ce taux de logements réalloués, défini par défaut à 90%. Plus
        la part de logements réalloués est élevée, plus le besoin lié à la dépense excessive en logements est faible, mais plus
        l’utilisateur anticipe des leviers pour mettre fin à ces situations par d’autres leviers que la construction.
      </p>
      <h3 id="menages-logement-degrade">Ménages habitant un logement dégradé</h3>
      <p>
        Les ménages dans des logements de mauvaise qualité sont repérés au sein du parc privé en fonction de la norme de qualité du logement
        fixée par l’évaluateur. Otelo considère qu’une partie des ménages qui occupent ces logements sont en situation de besoin. La qualité
        du logement peut s’apprécier selon la présence d’éléments de confort dans le logement et/ou par la qualité du bâti. Les sources
        disponibles sont affectées de biais différents : le Recensement fournit une information actualisée mais parcellaire (seul
        l’équipement sanitaire du logement y est décrit) tandis que les bases fiscales couvrent plusieurs aspects de la qualité du logement
        mais souffrent d’une actualisation souvent jugée insuffisante. À définition quasi constante, le choix de la source utilisée impacte
        de manière importante les volumes de cette composante du mal-logement. L’utilisateur doit d’abord choisir la source qu’il souhaite
        utiliser. Il a le choix entre le recensement, les fichiers fonciers ou le parc privé potentiellement indigne établi à partir de
        données fiscales fournies par le CGDD/SDES :
      </p>
      <ul>
        <li>
          S’il choisit le recensement, il lui faut ensuite définir les éléments de confort pris en compte dans la définition du logement de
          mauvaise qualité. Soit on considère qu’il suffit de constater l’absence de sanitaire dans le logement pour le considérer de
          mauvaise qualité, soit on exige également l’absence de chauffage
        </li>
        <li>
          S’il choisit les fichiers fonciers, il lui faut définir deux paramètres supplémentaires :
          <ul>
            <li>
              D’abord, les éléments de confort pris en compte dans la définition des logements de mauvaise qualité, parmi la liste suivante
              : absence de WC, absence de chauffage central, absence de salle de bain, absence de WC et chauffage central, absence de WC et
              salle de bain, absence de salle de bain et chauffage central, absence de WC, salle de bain et chauffage central.
            </li>
            <li>
              Puis, les éventuels éléments de qualité du bâti à prendre en compte dans définition des logements de mauvaise qualité : sans
              entretien ou sans entretien et de mauvaise qualité
            </li>
          </ul>
        </li>
        <li>
          S’il opte pour la source « parc privé potentiellement indigne (noyau dur) selon CGDD/SDES à partir de données fiscales, aucune
          autre précision sur le parc pris en compte n’est nécessaire. L’utilisateur doit ensuite choisir les statuts d’occupation qu’il
          souhaite prendre en compte, et ce quelle que soit la source retenue : locataires seuls, propriétaires seuls ou propriétaires et
          locataires. Par défaut, il est proposé de retenir les propriétaires et les locataires
        </li>
      </ul>
      <p>
        Enfin, l’utilisateur est invité à définir le taux de réallocation de ce parc de mauvaise qualité. En effet, une part sans doute
        significative de ces logements pourrait faire l'objet de travaux (après une période de vacance ou dans le cadre de leur usage
        actuel) et répondre à terme aux besoins en logement du territoire. Ces derniers ne génèrent donc pas de besoin en logements à
        l'horizon retenu. Le paramétrage par défaut prévoit une part de réallocation de 50%. Si l’utilisateur choisit ce paramétrage par
        défaut, il fait en réalité deux choix :
      </p>
      <ul className="fr-mb-4w">
        <li>
          Le choix de rénover 50% des résidences principales aujourd’hui dégradées à l’horizon de résorption, si du moins il souhaite mettre
          fin à ces situations de mal-logement
        </li>
        <li>
          Le choix de considérer 50% des résidences principales aujourd’hui dégradés comme non utilisables à l’horizon de résorption, ces
          logements sortent donc du parc des résidences principales potentielles
        </li>
      </ul>
      <hr />
      <h3 id="sur-occupation">Sur-occupation</h3>
      <p className="fr-text--bold">→ Choisir la source</p>
      <p>
        Deux sources permettent de l'apprécier : le recensement de l'INSEE et les données fiscales retraitées par le CGDD/SDES. Dans les
        deux cas, la population des ménages en situation de surpeuplement accentué (resp. suroccupation lourde) est une sous-population des
        ménages en situation de surpeuplement modéré (resp. suroccupation légère).
      </p>
      <p className="fr-text--bold">→ Définition INSEE</p>
      <p>
        La définition de l’INSEE du surpeuplement modéré ou accentué est basée sur le nombre de pièces du logement, le nombre de personnes
        du ménage, leur âge et leur sexe. Plus précisément, un logement est sur-occupé quand il lui manque au moins une pièce par rapport à
        la norme d’ « occupation normale », fondée sur le nombre de pièces nécessaires au ménage, décompté de la manière suivante :
      </p>
      <ul>
        <li>Une pièce de séjour pour le ménage ;</li>
        <li>Une pièce pour chaque personne de référence d'une famille ;</li>
        <li>Une pièce pour les personnes hors famille non célibataires ou les célibataires de 19 ans et plus ;</li>
        <li>
          Et, pour les célibataires de moins de 19 ans :
          <ul>
            <li>Une pièce pour deux enfants s'ils sont de même sexe ou ont moins de 7 ans ;</li>
            <li>Sinon, une pièce par enfant ;</li>
          </ul>
        </li>
      </ul>
      <p>
        Un logement auquel il manque une pièce est en situation de surpeuplement modéré. S'il manque deux pièces ou plus, il est en
        surpeuplement accentué. Par construction, les logements d'une pièce sont considérés comme sur-occupés.
      </p>
      <p className="fr-text--bold">→ Définition CGDD/SDES à partir de sources fiscales</p>
      <p>
        La définition de la suroccupation légère ou lourde dans les données fiscales retraitées par le CGDD/SDES fait intervenir la surface
        du logement et le nombre de personnes du ménage. Plus précisément, un ménage est considéré en situation de suroccupation dès lors
        que la surface habitable répond à l'inégalité suivante : Surface habitable &lt; 16 + 11 × (N − 1) où N est le nombre de personnes
        occupant le logement. On distingue :
      </p>
      <ul>
        <li>La suroccupation lourde : surface habitable &lt; 9*n </li>
        <li>La suroccupation légère : 9*n &lt; surface habitable &lt; 16 + 11 (n-1) </li>
      </ul>
      <p>
        Ainsi, un ménage d’une personne est en suroccupation lourde s’il occupe un logement d’une surface de 9 m² ou moins, et en situation
        de suroccupation légère si la surface est comprise entre 10 et 16 m². Pour deux personnes les seuils sont respectivement de 18 et 27
        m². Pour un couple avec deux enfants, ils s’élèvent respectivement à 36 et 49 m².
      </p>
      <p className="fr-text--bold">→ Choisir les statuts d’occupation pris en compte</p>
      <p>
        Une fois choisis la source et le type de suroccupation à prendre en compte, l’utilisateur doit choisir s’il souhaite considérer
        l’ensemble des ménages concernés ou s’il souhaite exclure les propriétaires occupants et/ou les locataires du parc privé. Si on
        décoche les deux statuts d’occupation, cela revient à ne pas prendre en compte les situations d’inadéquation physique dans
        l’évaluation du besoin en logements. Par défaut, seuls les locataires sont pris en compte.
      </p>
      <p className="fr-text--bold">→ Définir la part des logements réalloués</p>
      <p>
        Enfin, l’outil propose la fixation d’une part de logements « réalloués ». En effet, une situation d’inadéquation physique n’implique
        pas nécessairement un besoin en nouveaux logements, dans la mesure où une partie des logements concernés peut être réallouée à
        d’autres ménages, de taille plus modeste, sans générer de nouvelle situation de suroccupation. Plus la part de logements réalloués
        est élevée, plus le besoin en logements lié à l’inadéquation physique est faible. Par défaut, elle est de 80%.
      </p>
      <hr />
      <h2 id="doublons">Prise en compte de doublons éventuels</h2>
      <p>
        Certaines des situations de besoins identifiées et mesurées précédemment peuvent concerner un même ménage. Par exemple, on peut
        habiter un logement de mauvaise qualité et se trouver en situation de suroccupation. Il est aussi possible d’avoir un taux d’effort
        anormalement élevé pour un logement de mauvaise qualité. Sommer les situations identifiées aux étapes précédentes sans se soucier de
        ces situations de cumuls peut conduire à compter deux fois une même situation de besoin et donc à surestimer le besoin en stock. Il
        est donc nécessaire de corriger cette surestimation en estimant le nombre de ménages en situation de cumul.
      </p>
      <p>Pour ce faire, deux étapes sont nécessaires :</p>
      <ul className="fr-mb-4w">
        <li>
          Quantifier ces situations : la seule base de données permettant de le faire actuellement est l’Enquête Nationale Logement (ENL),
          dont l’échantillonnage ne permet qu’une analyse nationale, voire régionale en Île-de-France. Otelo applique donc dans tous les
          territoires de province une même proportion de doublons sur tous les territoires.
        </li>
        <li>Retrancher ces doublons des situations de mal-logement et du calcul du besoin issu du déficit actuel en logements.</li>
      </ul>
      <h5 id="quantifier-situations-cumul">Quantifier les situations de cumul de deux facteurs de besoin</h5>
      <p>
        Les données de l’Enquête National Logement (ENL) 2013 sur les ménages logés dans le parc libre permettent d’identifier six
        situations de cumul possibles, en croisant les facteurs de besoin.{' '}
      </p>
      <h5 id="retrancher-situations">Retrancher ces situations</h5>
      <p>
        Pour corriger les composantes du besoin en stock de ces doublons, ces derniers sont affectés à l’une et/ou l’autre des situations de
        besoins concernées :
      </p>
      <ul className="fr-mb-4w">
        <li>
          Les ménages en inadéquation financière comprenant des personnes hébergées ont bien besoin de deux logements. Ils sont donc
          conservés dans ces deux composantes du besoin en stock
        </li>
        <li>De même pour les ménages logés dans un logement de mauvaise qualité et comprenant des personnes hébergées</li>
        <li>
          - En revanche, les autres doublons ne doivent être conservés que dans une seule composante du besoin en stock. De manière
          normative, nous affectons cette correction des doublons au besoin lié à l’inadéquation financière, puis au besoin lié à la
          suroccupation.
        </li>
      </ul>
      <hr />
      <h2 id="elaborer-scenario">🎯 Élaborer un scénario</h2>
      <p>Cette section vous guide pour construire différents scénarios d'évolution de votre territoire.</p>
      <h3 id="etapes-recommandees">Étapes recommandées</h3>
      <h4 id="diagnostic-situation">1. 📋 Diagnostic de situation</h4>
      <ul>
        <li>Analysez les données actuelles de votre territoire (voir Infographie)</li>
        <li>Identifiez les tendances passées</li>
        <li>Repérez les spécificités locales</li>
      </ul>
      <h4 id="definition-parametres">2. 🎛️ Définition des paramètres</h4>
      <ul>
        <li>Choisissez vos hypothèses d'évolution (croissance, stabilité, déclin)</li>
        <li>Ajustez selon vos projets d'aménagement</li>
        <li>Intégrez les politiques publiques prévues</li>
      </ul>
      <h4 id="simulation-analyse">3. 📈 Simulation et analyse</h4>
      <ul>
        <li>Lancez les projections avec vos paramètres</li>
        <li>Comparez différents scénarios</li>
        <li>Analysez les impacts sur votre territoire</li>
      </ul>
      <h4 id="validation-ajustements">4. ✅ Validation et ajustements</h4>
      <ul className="fr-mb-4w">
        <li>Vérifiez la cohérence des résultats</li>
        <li>Ajustez si nécessaire</li>
        <li>Validez votre scénario final</li>
      </ul>
      <hr />
      <h2 id="comment-utiliser-otelo">🛠️ Comment bien utiliser Otelo</h2>
      <h3 id="conseils-pratiques">Conseils pratiques</h3>
      <h4 id="bonnes-pratiques">✅ Bonnes pratiques :</h4>
      <ul>
        <li>Commencez par explorer les données existantes avant de créer un scénario</li>
        <li>Comparez toujours plusieurs hypothèses d'évolution</li>
        <li>Prenez en compte les projets d'aménagement en cours sur votre territoire</li>
        <li>Confrontez vos résultats avec d'autres sources de données</li>
      </ul>
      <h4 id="points-attention">⚠️ Points d'attention :</h4>
      <ul>
        <li>Les scénarios sont des estimations, pas des certitudes</li>
        <li>Plus l'horizon temporel est lointain, plus l'incertitude augmente</li>
        <li>Actualisez régulièrement vos estimations avec les nouvelles données</li>
      </ul>
      <h3 id="support-assistance">Support et assistance</h3>
      <h4 id="cas-difficulte">En cas de difficulté :</h4>
      <p>Contactez l'équipe support pour un accompagnement personnalisé à otelo@beta.gouv.fr</p>
    </>
  )
}
