import Card from '@codegouvfr/react-dsfr/Card'
import type { Metadata } from 'next'

const PLACEHOLDER_IMAGE = 'https://www.systeme-de-design.gouv.fr/v1.14/storybook/img/placeholder.16x9.png'

export const metadata: Metadata = {
  title: 'Aller plus loin dans la méthodologie - Otelo',
}

export default function AllerPlusLoinMethodologiePage() {
  return (
    <>
      <h1>Aller plus loin dans la méthodologie</h1>
      <p>
        Otelo repose sur une méthodologie qui combine données démographiques, données sur le parc de logements et paramètres ajustables.
        Cette rubrique propose des fiches pédagogiques pour mieux comprendre :
      </p>
      <ul>
        <li>les sources de données utilisées</li>
        <li>les méthodes de projection</li>
        <li>les concepts mobilisés dans l'analyse des besoins en logement</li>
      </ul>
      <p>Ces fiches vous permettent de mieux interpréter les résultats produits par l'outil.</p>

      <h2 id="comprendre-donnees-projections">📚 Comprendre les données et les calculs de projection</h2>
      <p>
        Otelo repose sur une méthodologie qui combine données démographiques, données sur le parc de logements et paramètres ajustables. Ces
        fiches expliquent les bases méthodologiques d'Otelo et les principales données mobilisées.
      </p>
      <p>
        Pour en savoir plus sur les données, consultez la <a href="/sources-de-donnees">source des données</a>.
      </p>

      <h3 id="methodologie-donnees">Otelo – Méthodologie et données</h3>
      <div className="fr-pb-4w">
        <Card
          size="large"
          border
          background
          enlargeLink
          title="Otelo – Méthodologie et données"
          desc="Découvrez la méthodologie d'Otelo de A à Z pour une estimation des besoins en logements."
          imageUrl="/assets/centre-d-aide/Otelo - Méthodologie & données.pptx.jpg"
          imageAlt="Fiche : Otelo – Méthodologie et données"
          linkProps={{
            href: 'https://fichiers.numerique.gouv.fr/explorer/items/files/714-81dd-cd04022502a8',
            target: '_blank',
            rel: 'noopener noreferrer',
          }}
          titleAs="h4"
        />
      </div>

      <h3 id="projections-demographiques">Comment sont calculées les projections démographiques ?</h3>
      <div className="fr-pb-4w">
        <Card
          size="large"
          border
          background
          enlargeLink
          title="Comment sont calculées les projections démographiques ?"
          desc="Découvrez la méthode de calcul Omphale pour estimer les projections démographiques de votre territoire."
          imageUrl="/assets/centre-d-aide/Otelo - Comment sont calculées les projections démographiques .jpg"
          imageAlt="Fiche : Comment sont calculées les projections démographiques ?"
          linkProps={{
            href: 'https://fichiers.numerique.gouv.fr/explorer/items/files/afd9538b-e016-4b34-b2f0-2566e54e5059',
            target: '_blank',
            rel: 'noopener noreferrer',
          }}
          titleAs="h4"
        />
      </div>

      <h3 id="projections-menages">Comment sont calculées les projections en ménages ?</h3>
      <div className="fr-pb-4w">
        <Card
          size="large"
          border
          background
          enlargeLink
          title="Comment sont calculées les projections en ménages ?"
          desc="Découvrez comment passer des projections démographiques aux projections en nombre de ménages sur votre territoire."
          imageUrl="/assets/centre-d-aide/Otelo - Comment sont calculées les projections en ménage .jpg"
          imageAlt="Fiche : Comment sont calculées les projections en ménages ?"
          linkProps={{
            href: 'https://fichiers.numerique.gouv.fr/explorer/items/files/e16d3c8b-ecd5-4ebd-9873-9e13e8f5c916',
            target: '_blank',
            rel: 'noopener noreferrer',
          }}
          titleAs="h4"
        />
      </div>

      {/* <h3 id="mal-logement-integration">Comment sont intégrées les situations de mal-logement ?</h3>
      <div className="fr-pb-4w">
        <Card
          size="large"
          border
          background
          title="Comment sont intégrées les situations de mal-logement ?"
          desc="Découvrez quelles situations du mal-logement sont prises en compte dans Otelo et comment elles sont intégrées. Fiche pédagogique à venir."
          imageUrl={PLACEHOLDER_IMAGE}
          imageAlt="Fiche : Comment sont intégrées les situations de mal-logement ?"
          linkProps={{
            href: '#',
          }}
          titleAs="h4"
        />
      </div> */}

      <h2 id="comprendre-parametres-parc">⚙️ Comprendre les paramètres qui influent sur le parc existant</h2>
      <p>
        Les besoins en logement dépendent de nombreux facteurs liés au fonctionnement du parc de logements et aux situations d'habitat. Ces
        fiches détaillent les principaux paramètres.
      </p>

      <h3 id="vacance-longue-duree">La vacance de longue durée</h3>
      <div className="fr-pb-4w">
        <Card
          size="large"
          border
          background
          enlargeLink
          title="La vacance de longue durée"
          desc="En agissant sur la vacance de longue durée, le besoin de constructions neuves se réduit au profit de la mobilisation du parc existant."
          imageUrl="/assets/centre-d-aide/Otelo - Comment est calculée la résorption de la vacance .jpg"
          imageAlt="Fiche : La vacance de longue durée"
          linkProps={{
            href: 'https://fichiers.numerique.gouv.fr/explorer/items/files/bc40c642-54c6-42a4-b332-05e29921823b',
            target: '_blank',
            rel: 'noopener noreferrer',
          }}
          titleAs="h4"
        />
      </div>

      <h3 id="residences-secondaires">Les résidences secondaires</h3>
      <div className="fr-pb-4w">
        <Card
          size="large"
          border
          background
          title="Les résidences secondaires"
          desc="Fiche pédagogique à venir."
          imageUrl={PLACEHOLDER_IMAGE}
          imageAlt="Fiche : Les résidences secondaires"
          linkProps={{
            href: '#',
          }}
          titleAs="h4"
        />
      </div>

      <h3 id="disparitions-restructurations">Les disparitions et restructurations</h3>
      <div className="fr-pb-4w">
        <Card
          size="large"
          border
          background
          title="Les disparitions et restructurations"
          desc="Fiche pédagogique à venir."
          imageUrl={PLACEHOLDER_IMAGE}
          imageAlt="Fiche : Les disparitions et restructurations"
          linkProps={{
            href: '#',
          }}
          titleAs="h4"
        />
      </div>

      <h2 id="utiliser-otelo-politiques">🏛️ Utiliser Otelo dans les politiques publiques</h2>
      <p>
        Les résultats produits par Otelo sont mobilisés pour éclairer les politiques locales de l'habitat et les documents d'urbanisme. Ces
        fiches apportent des clés pour expliquer et utiliser les résultats dans un contexte opérationnel.
      </p>

      <h3 id="repondre-aux-elus">Que répondre aux élus ?</h3>
      <div className="fr-pb-4w">
        <Card
          size="large"
          border
          background
          enlargeLink
          title="Que répondre aux élus ?"
          desc="Au-delà de son utilisation en tant qu'outil, Otelo se veut être un outil de dialogue et de pédagogie pour favoriser la mise en place de politiques durables de l'habitat."
          imageUrl="/assets/centre-d-aide/Otelo - Que répondre aux élus.jpg"
          imageAlt="Fiche : Que répondre aux élus ?"
          linkProps={{
            href: 'https://fichiers.numerique.gouv.fr/explorer/items/files/2f086e9d-548d-488d-b147-6b057a2d5bbf',
            target: '_blank',
            rel: 'noopener noreferrer',
          }}
          titleAs="h4"
        />
      </div>

      <h3 id="je-suis-ddt">Je suis une DDT</h3>
      <div className="fr-pb-4w">
        <Card
          size="large"
          border
          background
          enlargeLink
          title="Je suis une DDT"
          desc="En tant que DDT, découvrez cette fiche dédiée pour accompagner l'utilisation d'Otelo."
          imageUrl="/assets/centre-d-aide/Otelo - Je suis un DDT.jpg"
          imageAlt="Fiche : Je suis une DDT"
          linkProps={{
            href: 'https://fichiers.numerique.gouv.fr/explorer/items/files/aa49f245-f95b-408e-8db9-1d682f6e3491',
            target: '_blank',
            rel: 'noopener noreferrer',
          }}
          titleAs="h4"
        />
      </div>
    </>
  )
}
