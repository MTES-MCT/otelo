import Card from '@codegouvfr/react-dsfr/Card'
import type { Metadata } from 'next'

const PLACEHOLDER_IMAGE = 'https://www.systeme-de-design.gouv.fr/v1.14/storybook/img/placeholder.16x9.png'

export const metadata: Metadata = {
  title: "Apprendre à utiliser l'outil pas à pas - Otelo",
}

export default function ApprendreAUtiliserLOutilPage() {
  return (
    <>
      <h1>Apprendre à utiliser l'outil pas à pas</h1>
      <p>
        Vous débutez sur Otelo ou vous souhaitez mieux maîtriser certaines fonctionnalités ? Ces tutoriels vidéo vous accompagnent pas à pas
        dans l'utilisation de l'outil, depuis la création d'un scénario jusqu'à l'analyse des résultats.
      </p>
      <p>Chaque vidéo présente une manipulation précise dans l'interface.</p>

      <h2 id="debuter-sur-otelo">🚀 Débuter sur Otelo</h2>
      <p>Avant de paramétrer vos projections, il est important de comprendre comment créer et structurer un scénario.</p>

      <h3 id="creer-un-compte">Créer un compte Otelo</h3>
      <p>
        En tant que DDT, collectivité, SCoT, agences d'urbanisme, vous avez accès à Otelo gratuitement. Pour les bureaux d'études ou autres,
        vous pouvez accéder à l'application sous mandat d'une collectivité ou territoire le temps de votre étude.
      </p>
      {/* <div>
        <Card
          size="large"
          border
          background
          enlargeLink
          title="Créer un compte Otelo"
          desc="Découvrez comment créer votre compte et accéder à Otelo."
          imageUrl={PLACEHOLDER_IMAGE}
          imageAlt="Tutoriel : Créer un compte Otelo"
          linkProps={{
            href: 'https://fichiers.numerique.gouv.fr/explorer/items/files/57627a48-016d-4613-80ec-832c43dbf7d8',
            target: '_blank',
            rel: 'noopener noreferrer',
          }}
          titleAs="h4"
        />
      </div> */}

      <h3 id="debuter-elaboration-scenario">Débuter l'élaboration d'un scénario</h3>
      <div className="fr-pb-4w">
        <Card
          size="large"
          border
          background
          enlargeLink
          title="Débuter l'élaboration d'un scénario"
          desc="  Initiez votre scénario dans Otelo en partant des clés, comme le territoire et l'horizon de projection, et construisez rapidement une
        analyse adaptée à vos besoins."
          imageUrl="/assets/centre-d-aide/Otelo - Débuter l'élaboration d'un scénario.jpg"
          imageAlt="Tutoriel : Débuter l'élaboration d'un scénario"
          linkProps={{
            href: 'https://fichiers.numerique.gouv.fr/explorer/items/files/ad0257dc-03fe-4a8f-a912-9e6a7b76cce0',
            target: '_blank',
            rel: 'noopener noreferrer',
          }}
          titleAs="h4"
        />
      </div>

      <h3 id="elaborer-scenario-a-z">Élaborer un scénario de A à Z</h3>

      <div className="fr-pb-4w">
        <Card
          size="large"
          border
          background
          enlargeLink
          title="Élaborer un scénario de A à Z"
          desc="Construisez votre scénario dans Otelo pas à pas : définissez le territoire, l'horizon de projection, puis paramétrez les hypothèses
        clés (démographie, vacance, résidences secondaires, dynamique du parc) pour obtenir une première estimation complète."
          imageUrl="/assets/centre-d-aide/Otelo - Elaborer un scénario de A à Z.jpeg"
          imageAlt="Tutoriel : Élaborer un scénario de A à Z"
          linkProps={{
            href: 'https://fichiers.numerique.gouv.fr/explorer/items/files/b2dc0394-1fe4-4e99-83e5-d3c3461e483f',
            target: '_blank',
            rel: 'noopener noreferrer',
          }}
          titleAs="h4"
        />
      </div>

      <h3 id="creer-territoire-facon">Créer un territoire à façon</h3>
      <div className="fr-pb-4w">
        <Card
          size="large"
          border
          background
          enlargeLink
          title="Créer un territoire à façon"
          desc="Sélectionnez vos EPCIs pour créer votre propre territoire à façon – pratique pour travailler sur un SCoT ou un autre territoire que
        le bassin d'habitat."
          imageUrl="/assets/centre-d-aide/Otelo - Créer un territoire à façon.jpg"
          imageAlt="Tutoriel : Créer un territoire à façon"
          linkProps={{
            href: 'https://fichiers.numerique.gouv.fr/explorer/items/files/ce44e287-be88-49b4-a64e-330b2c6d21a0',
            target: '_blank',
            rel: 'noopener noreferrer',
          }}
          titleAs="h4"
        />
      </div>

      <h2 id="parametrer-scenario">⚙️ Paramétrer son scénario</h2>
      <p>
        Afin de construire des scénarios adaptés aux spécificités locales, ces tutoriels vous expliquent comment modifier les principaux
        paramètres du modèle.
      </p>

      <h3 id="parametrer-projections-demo">Paramétrer les projections démographiques</h3>

      <div className="fr-pb-4w">
        <Card
          size="large"
          border
          background
          enlargeLink
          title="Paramétrer les projections démographiques"
          desc="Paramétrez votre scénario démographique dans Otelo en croisant projections de population et évolution du nombre de ménages
        (décohabitation), afin d'obtenir des estimations de besoins en logements cohérentes avec votre territoire et ses dynamiques."
          imageUrl="/assets/centre-d-aide/Otelo - Paramétrer les projections démographiques.jpg"
          imageAlt="Tutoriel : Paramétrer les projections démographiques"
          linkProps={{
            href: 'https://fichiers.numerique.gouv.fr/explorer/items/files/c638f97d-0412-49b4-b818-d86a37576e2e',
            target: '_blank',
            rel: 'noopener noreferrer',
          }}
          titleAs="h4"
        />
      </div>
      <h3 id="importer-donnees-facon">Importer des données à façon</h3>

      <div className="fr-pb-4w">
        <Card
          size="large"
          border
          background
          enlargeLink
          title="Importer des données à façon"
          desc="Créez vos propres projections en ménage et importez-les directement dans Otelo pour estimer vos besoins en logements sur votre
        territoire."
          imageUrl="/assets/centre-d-aide/Otelo - Importer des données à façon.jpg"
          imageAlt="Tutoriel : Importer des données à façon"
          linkProps={{
            href: 'https://fichiers.numerique.gouv.fr/explorer/items/files/aedef053d189',
            target: '_blank',
            rel: 'noopener noreferrer',
          }}
          titleAs="h4"
        />
      </div>
      <p>
        Ces projections peuvent être obtenues en faisant une demande auprès de l'Insee.{' '}
        <a href="https://www.insee.fr/fr/information/1303412" target="_blank" rel="noopener noreferrer">
          En savoir plus
        </a>
      </p>

      <h3 id="cibler-vacants">Cibler le taux de logements vacants de longue durée</h3>
      <div className="fr-pb-4w">
        <Card
          size="large"
          border
          background
          enlargeLink
          title="Cibler le taux de logements vacants de longue durée"
          desc="Paramétrez vos taux de remobilisation des logements vacants de longue durée afin d'affiner vos estimations de besoins en logements
        et d'intégrer le potentiel existant de votre territoire."
          imageUrl={PLACEHOLDER_IMAGE}
          imageAlt="Tutoriel : Cibler le taux de logements vacants de longue durée"
          linkProps={{
            href: 'https://fichiers.numerique.gouv.fr/explorer/items/files/8dc2edd6-a9b6-44e0-84fa-80f75bd76a54',
            target: '_blank',
            rel: 'noopener noreferrer',
          }}
          titleAs="h4"
        />
      </div>
      <h3 id="cibler-residences-secondaires">Cibler le taux de résidences secondaires</h3>
      <div className="fr-pb-4w">
        <Card
          size="large"
          border
          background
          enlargeLink
          title="Cibler le taux de résidences secondaires"
          desc="Paramétrez vos hypothèses sur les résidences secondaires afin d'affiner vos estimations de besoins en logements et d'intégrer les
        spécificités d'usage de votre territoire."
          imageUrl={PLACEHOLDER_IMAGE}
          imageAlt="Tutoriel : Cibler le taux de résidences secondaires"
          linkProps={{
            href: 'https://fichiers.numerique.gouv.fr/explorer/items/files/0de45f0f-ecf2-4dae-98da-bb9897d22375',
            target: '_blank',
            rel: 'noopener noreferrer',
          }}
          titleAs="h4"
        />
      </div>
      <h3 id="parametrer-renouvellement">Paramétrer les dynamiques de renouvellement urbain</h3>

      <div className="fr-pb-4w">
        <Card
          size="large"
          border
          background
          enlargeLink
          title="Paramétrer les dynamiques de renouvellement urbain"
          desc="Paramétrez les dynamiques de renouvellement urbain en intégrant les disparitions et restructurations, afin d'affiner vos estimations
        de besoins en logements et refléter les transformations du parc existant."
          imageUrl="/assets/centre-d-aide/Otelo - Paramétrer les dynamiques de renouvellement urbain.jpg"
          imageAlt="Tutoriel : Paramétrer les dynamiques de renouvellement urbain"
          linkProps={{
            href: 'https://fichiers.numerique.gouv.fr/explorer/items/files/3f8c2b60-01ed-47da-91e8-d784a0a01fd4',
            target: '_blank',
            rel: 'noopener noreferrer',
          }}
          titleAs="h4"
        />
      </div>

      <h3 id="parametrer-mal-logement">Paramétrer le mal-logement</h3>
      <div className="fr-pb-4w">
        <Card
          size="large"
          border
          background
          enlargeLink
          title="Paramétrer le mal-logement"
          desc="Paramétrez le mal-logement en intégrant les différentes situations de votre territoire (sans hébergement, hébergés chez un tiers,
        inadéquation financière, sur-occupation, insalubrité) pour élaborer des politiques de l'habitat responsables et adaptées."
          imageUrl="/assets/centre-d-aide/Otelo - Résorber le mal-logement.jpg"
          imageAlt="Tutoriel : Paramétrer le mal-logement"
          linkProps={{
            href: 'https://fichiers.numerique.gouv.fr/explorer/items/files/d587713d-0bfb-4c77-9522-e0a1d057c354',
            target: '_blank',
            rel: 'noopener noreferrer',
          }}
          titleAs="h4"
        />
      </div>
      <h2 id="exploiter-resultats">📊 Exploiter les résultats</h2>
      <p>Une fois votre scénario calculé, Otelo vous permet d'analyser les résultats et de les partager avec les élus ou partenaires.</p>

      {/* <h3 id="interpreter-resultats">Interpréter ses résultats</h3>
      <div className="fr-pb-4w">
        <Card
          size="large"
          border
          background
          title="Interpréter ses résultats"
          desc="Vidéo en cours de réalisation"
          imageUrl={PLACEHOLDER_IMAGE}
          imageAlt="Tutoriel : Interpréter ses résultats"
          linkProps={{
            href: '#',
          }}
          titleAs="h4"
        />
      </div> */}

      <h3 id="generer-powerpoint">Générer une présentation PowerPoint éditable</h3>

      <div className="fr-pb-4w">
        <Card
          size="large"
          border
          background
          enlargeLink
          title="Générer une présentation PowerPoint éditable"
          desc="Élaborez 3 scénarios pour une étude commune et générez une présentation PowerPoint prête à être utilisée pour vos présentations aux
        élus, groupes de travail ou prises de décision."
          imageUrl="/assets/centre-d-aide/Otelo - Générer une présentation ppt éditable.jpg"
          imageAlt="Tutoriel : Générer une présentation PowerPoint éditable"
          linkProps={{
            href: 'https://fichiers.numerique.gouv.fr/explorer/items/files/bfaba25f960b',
            target: '_blank',
            rel: 'noopener noreferrer',
          }}
          titleAs="h4"
        />
      </div>
      {/* <h3 id="acces-sources-infographies">Avoir accès aux sources de données et aux infographies</h3>
      <p>
        Ayez accès à l'ensemble des données de votre territoire pour vous aider à prendre les bonnes hypothèses. Vous avez également accès
        aux sources de données pour chaque paramètre.
      </p>
      <div className="fr-pb-4w">
        <Card
          size="large"
          border
          background
          title="Avoir accès aux sources de données et aux infographies"
          desc="Vidéo en cours de réalisation"
          imageUrl={PLACEHOLDER_IMAGE}
          imageAlt="Tutoriel : Avoir accès aux sources de données et aux infographies"
          linkProps={{
            href: '#',
          }}
          titleAs="h4"
        />
      </div> */}
    </>
  )
}
