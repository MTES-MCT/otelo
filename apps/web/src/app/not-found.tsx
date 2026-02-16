import { fr } from '@codegouvfr/react-dsfr'
import Breadcrumb from '@codegouvfr/react-dsfr/Breadcrumb'
import Button from '@codegouvfr/react-dsfr/Button'

export default function NotFound() {
  return (
    <div className={fr.cx('fr-container')}>
      <Breadcrumb
        currentPageLabel="Page non trouvée"
        homeLinkProps={{
          href: '/accueil',
        }}
        segments={[]}
      />

      <div className={fr.cx('fr-py-3w')}>
        <h1>Page introuvable</h1>
        <hr />
        <h3>Erreur 404</h3>
        <div className={fr.cx('fr-col-md-8')}>
          <p>La page que vous cherchez est introuvable. Excusez-nous pour la gêne occasionnée.</p>
        </div>

        <div>
          <p style={{ margin: 0 }}>Si vous avez tapé l&apos;adresse web dans le navigateur, vérifiez qu&apos;elle est correcte.</p>
          <p style={{ margin: 0 }}>La page n&apos;est peut-être plus disponible.</p>
          <p>Dans ce cas, pour continuer votre visite vous pouvez consulter la page d&apos;accueil.</p>
        </div>

        <Button iconId="ri-arrow-left-line" iconPosition="left" linkProps={{ href: '/accueil' }}>
          Page d&apos;accueil
        </Button>
      </div>
    </div>
  )
}
