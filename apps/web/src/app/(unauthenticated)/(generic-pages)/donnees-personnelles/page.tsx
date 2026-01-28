import type { Metadata } from 'next'
import { CONTACT_EMAIL } from '~/utils/resources'

export const metadata: Metadata = {
  title: 'Données personnelles sur le site Otelo',
}

export default function DonneesPersonnellesPage() {
  return (
    <section>
      <h1>
        <strong>Politique de confidentialité</strong>
      </h1>

      <p>
        <em>Dernière mise à jour le 5 juin 2025</em>
      </p>

      <h1>
        <strong>POLITIQUE DE CONFIDENTIALITÉ DE LA PLATEFORME « OTELO »</strong>
      </h1>

      <h2>
        <strong>Qui sommes-nous ?</strong>
      </h2>

      <p>
        Otelo est un service public numérique, sous la responsabilité de traitement du ministère de la Transition écologique, qui accompagne
        les collectivités territoriales et acteurs publics dans l'estimation des besoins en logement sur leur territoire, dans le but de
        faciliter la planification urbaine et la mise en œuvre de politiques de logement adaptées aux besoins réels de la population.
      </p>

      <h2>
        <strong>Pourquoi traitons-nous des données à caractère personnel ?</strong>
      </h2>

      <p>
        Otelo traite des données identifiantes pour permettre aux utilisateurs habilités de bénéficier d'un espace personnel pour accéder
        aux outils d'estimation des besoins en logement et collaborer avec d'autres acteurs de l'aménagement du territoire.
      </p>

      <h2>
        <strong>Quelles sont les données à caractère personnel que nous traitons ?</strong>
      </h2>

      <p>Otelo va être amené à collecter les données suivantes :</p>

      <ul>
        <li>Données relatives aux analyses et estimations : nom, prénom, fonction, adresse e-mail, numéro de téléphone ;</li>
        <li>Données relatives à l'inscription aux évènements : adresse e-mail ;</li>
        <li>Données de traçabilité : logs et adresse IP.</li>
      </ul>

      <h2>
        <strong>Qu'est-ce qui nous autorise à traiter des données à caractère personnel ?</strong>
      </h2>

      <p>
        Otelo traite des données à caractère personnel pour l'exécution d'une mission d'intérêt public ou relevant de l'exercice de
        l'autorité publique dont est investi le responsable de traitement conformément à l'article 6-1 e) du RGPD.
      </p>

      <p>Cette mission d'intérêt public se traduit en pratique par :</p>

      <ul>
        <li>
          Le décret n° 2023-XX du XX XXXX 2023 relatif aux attributions du ministre de la Transition écologique, notamment son article
          premier.
        </li>
      </ul>

      <h2>
        <strong>Pendant combien de temps conservons-nous vos données à caractère personnel ?</strong>
      </h2>

      <p>
        Les données relatives aux analyses et estimations sont conservées pendant 6 ans à compter du dernier contact avec la personne
        concernée. Les données relatives à la newsletter sont conservées jusqu'à la désinscription. Les données relatives à la traçabilité
        sont conservées pendant 1 an, conformément à la LCEN.
      </p>

      <h2>
        <strong>Quels sont vos droits ?</strong>
      </h2>

      <p>Vous disposez des droits suivants concernant vos données à caractère personnel :</p>

      <ul>
        <li>Droit dʼinformation et droit d'accès aux données ;</li>
        <li>Droit de rectification ;</li>
        <li>Droit d'opposition ;</li>
        <li>Droit à la limitation du traitement de vos données.</li>
      </ul>

      <p>
        Pour les exercer, vous pouvez contacter l'adresse suivante : <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
      </p>

      <p>Ou par voie postale :</p>

      <p>
        En raison de lʼobligation de sécurité et de confidentialité dans le traitement des données à caractère personnel qui incombe au
        responsable de traitement, votre demande ne sera traitée que si vous apportez la preuve de votre identité. Pour vous aider dans
        votre démarche, consulter la fiche CNIL Exercer son droit d'accès.
      </p>

      <p>
        Ministère de la Transition écologique
        <br />À l'attention du délégué à la protection des données (DPD)
        <br />
        Tour Séquoia
        <br />
        92055 La Défense Cedex, France
      </p>

      <p>
        Puisque ce sont des droits personnels, nous ne traiterons votre demande que si nous sommes en mesure de vous identifier. Dans le cas
        où nous ne parvenons pas à vous identifier, nous pouvons être amenés à vous demander une preuve de votre identité.
      </p>

      <p>Pour vous aider dans votre démarche, la CNIL a élaboré un modèle de courrier.</p>

      <p>
        Le responsable de traitement s'engage à vous répondre dans un délai raisonnable qui ne saurait dépasser 1 mois à compter de la
        réception de votre demande.
      </p>

      <h2>
        <strong>Qui peut accéder à vos données ?</strong>
      </h2>

      <p>Les destinataires des données sont les membres de l'équipe Otelo et les collectivités territoriales concernées.</p>

      <h2>
        <strong>Qui nous aide à traiter vos données à caractère personnel ?</strong>
      </h2>

      <p>
        Certaines données sont envoyées à des sous-traitants pour réaliser certaines missions. Le responsable de traitements s'est assuré de
        la mise en œuvre par ses sous-traitants de garanties adéquates et du respect de conditions strictes de confidentialité et de
        sécurité des données.
      </p>

      <table className="fr-table">
        <thead>
          <tr>
            <th>Partenaire</th>
            <th>Pays destinataire</th>
            <th>Traitement réalisé</th>
            <th>Garanties</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>OVH</td>
            <td>France</td>
            <td>Hébergement des données</td>
            <td></td>
          </tr>
          <tr>
            <td></td>
            <td></td>
            <td>Inscription à nos évènements</td>
            <td></td>
          </tr>
        </tbody>
      </table>

      <h2>
        <strong>Cookies et traceurs</strong>
      </h2>

      <p>
        Un cookie est un fichier déposé sur votre terminal lors de la visite d'un site. Il a pour but de collecter des informations
        relatives à votre navigation et de vous adresser des services adaptés à votre terminal (ordinateur, mobile ou tablette).
      </p>

      <p>
        En application de l'article 5(3) de la directive 2002/58/CE modifiée concernant le traitement des données à caractère personnel et
        la protection de la vie privée dans le secteur des communications électroniques, transposée à l'article 82 de la loi n°78-17 du 6
        janvier 1978 relative à l'informatique, aux fichiers et aux libertés, les traceurs ou cookies suivent deux régimes distincts.
      </p>

      <p>
        Les cookies strictement nécessaires au service ou ayant pour finalité exclusive de faciliter la communication par voie électronique
        sont dispensés de consentement préalable au titre de l'article 82 de la loi n°78-17 du 6 janvier 1978.
      </p>

      <p>
        Les cookies n'étant pas strictement nécessaires au service ou n'ayant pas pour finalité exclusive de faciliter la communication par
        voie électronique doivent être consenti par l'utilisateur.
      </p>

      <p>
        Ce consentement de la personne concernée pour une ou plusieurs finalités spécifiques constitue une base légale au sens du RGPD et
        doit être entendu au sens de l'article 6-1 a) du Règlement (UE) 2016/679 du Parlement européen et du Conseil du 27 avril 2016
        relatif à la protection des personnes physiques à l'égard du traitement des données à caractère personnel et à la libre circulation
        de ces données.
      </p>

      <p>
        Otelo utilise Matomo, configuré en mode exempté et ne nécessitant pas le recueil de votre consentement, conformément aux
        recommandations de la CNIL.
      </p>

      <p>Pour en savoir plus, vous pouvez consulter les fiches suivantes proposées par la CNIL :</p>

      <ul>
        <li>
          <a href="https://www.cnil.fr/fr/cookies-et-autres-traceurs/regles/cookies/que-dit-la-loi" target="_blank" rel="noreferrer">
            Cookies & traceurs : que dit la loi ?
          </a>
        </li>
        <li>
          <a
            href="https://www.cnil.fr/fr/cookies-et-autres-traceurs/comment-se-proteger/maitriser-votre-navigateur"
            target="_blank"
            rel="noreferrer"
          >
            Cookies : les outils pour les maîtriser
          </a>
        </li>
      </ul>
    </section>
  )
}
