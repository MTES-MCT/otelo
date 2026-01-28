import type { Metadata } from 'next'
import { CONTACT_EMAIL } from '~/utils/resources'

export const metadata: Metadata = {
  title: 'Mentions légales Otelo',
}

export default function MentionsLegalesPage() {
  return (
    <div>
      <h1 className="fr-pt-2w">Contactez-nous</h1>
      <p>
        Des questions ? Une difficulté ? Envoyez-nous un email à <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.
      </p>
      <h2>Mentions légales</h2>
      <h3>Éditeur de la Plateforme</h3>
      <p>
        L'outil Otelo est éditée par le <b>Ministère de la transition écologique</b> (Direction Habitat, Urbanisme et Paysages).
      </p>
      <p>
        Ministère de la Transition écologique
        <br />
        244, Boulevard Saint Germain
        <br />
        75007 Paris
        <br />
        France
      </p>
      <h3>Directeur de la publication</h3>
      <p>Stéphanie Dupuy-Lyon, Directrice générale de l'Aménagement, du Logement et de la Nature</p>
      <h3>Conception et développement</h3>
      <p>
        Réalisation technique : Cerema
        <br />
        Elaboration des contenus / Parcours utilisateur : DHUP / Cerema
      </p>
      <h3>Hébergement de la Plateforme</h3>
      <p>Ce site est hébergé par le Cerema, à Champs-sur-Marne, en France.</p>
      <h3>Accessibilité</h3>
      <p>
        La conformité aux normes d’accessibilité numérique est un objectif ultérieur. En attendant, nous tâchons de rendre ce site
        accessible à toutes et à tous :
      </p>
      <p></p>
      <ul className="fr-list">
        <li>Utilisation de composants accessibles</li>
        <li>Respect des bonnes pratiques</li>
        <li>Tests utilisateurs</li>
      </ul>
      <p></p>
      <h3>Signaler un dysfonctionnement</h3>
      <p>
        Si vous rencontrez un défaut d’accessibilité vous empêchant d’accéder à un contenu ou une fonctionnalité du site, merci de nous en
        faire part en{' '}
        <a title="Contactez-nous" href={`mailto:${CONTACT_EMAIL}`} target="_blank" rel="noopener noreferrer">
          nous contactant à l'adresse {CONTACT_EMAIL}
        </a>
        .
      </p>
      <p>
        Si vous n’obtenez pas de réponse rapide de notre part, vous êtes en droit de faire parvenir vos doléances ou une demande de saisine
        au Défenseur des droits.
      </p>
      <h3>En savoir plus</h3>
      <p>
        Pour en savoir plus sur la politique d’accessibilité numérique de l’État&nbsp;:{' '}
        <a href="http://references.modernisation.gouv.fr/accessibilite-numerique">
          http://references.modernisation.gouv.fr/accessibilite-numerique
        </a>
      </p>
      <h3>Sécurité</h3>
      <p>
        Le site est protégé par un certificat électronique, matérialisé pour la grande majorité des navigateurs par un cadenas. Cette
        protection participe à la confidentialité des échanges. En aucun cas les services associés à la plateforme ne seront à l’origine
        d’envoi de courriels pour demander la saisie d’informations personnelles.
      </p>
      <hr />
      <div className="fr-pt-3w">
        <h3>Gestion des cookies</h3>
        <p>
          Un cookie est une information déposée sur votre disque dur par le serveur du site que vous visitez. Les cookies sont notamment
          gérés par votre navigateur internet. Deux types de cookies sont utilisés pour ce site.
        </p>
        <h4>Cookies de sessions</h4>
        <p>Ce site utilise des cookies de sessions afin de permettre à l'utilisateur d’accéder à son compte.</p>
        <h4>Cookies de mesure d’audience</h4>
        <p>
          Ce site utilise des cookies de mesure d’audience. Les données sont uniquement destinées à des fins statistiques et en vue
          d'améliorer l'expérience utilisateur.
        </p>
      </div>
    </div>
  )
}
