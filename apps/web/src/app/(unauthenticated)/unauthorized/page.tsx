import { fr } from '@codegouvfr/react-dsfr'
import Button from '@codegouvfr/react-dsfr/Button'
import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '~/lib/auth/auth.config'
import { TSession } from '~/types/next-auth'

export default async function Unauthorized() {
  const session = (await getServerSession(authOptions)) as TSession
  if (session?.user.hasAccess || session?.user.role === 'ADMIN') {
    redirect('/accueil')
  }
  return (
    <div className={fr.cx('fr-container', 'fr-py-20v')}>
      <div className={fr.cx('fr-grid-row', 'fr-grid-row--center')}>
        <div className={fr.cx('fr-col-12', 'fr-col-md-8', 'fr-col-lg-6')}>
          <div className="fr-text--center">
            <div className={fr.cx('fr-mb-4v')}>
              <span className="fr-icon-warning-line fr-icon--lg" style={{ color: 'var(--error-425-625)' }} />
            </div>
            <h1 className={fr.cx('fr-mb-4v')}>Accès non autorisé</h1>
            <p className={fr.cx('fr-text--lg', 'fr-mb-4v')}>
              Votre connexion n'est pas encore autorisée car vous n'avez pas terminé l'étape de demande d'accès via Démarches Simplifiées.
            </p>
            <p className={fr.cx('fr-text--sm', 'fr-mb-6v')}>
              Pour accéder à Otelo, vous devez d'abord déposer une demande d'accès auprès du ministère de la transition écologique auprès de
              Démarches Simplifiées.
            </p>
            <p className={fr.cx('fr-text--sm', 'fr-mb-6v')}>
              Le formulaire d'acte d'engagement à Otelo est disponible en cliquant sur le bouton ci-dessous. La signature de l'acte
              d'engagement est obligatoire pour accéder à Otelo. Il vous sera demandé lors du dépôt de votre demande d'accès sur Démarches
              Simplifiées.
            </p>
            <div>
              <Button
                linkProps={{ href: '/assets/pdf/acte_engagement.pdf', target: '_blank' }}
                priority="tertiary"
                size="large"
                className={fr.cx('fr-mb-4v')}
              >
                Télécharger l'acte d'engagement
              </Button>
            </div>
            <div>
              <Button
                linkProps={{ href: 'https://www.demarches-simplifiees.fr/commencer/acces-a-otelo', target: '_blank' }}
                priority="primary"
                size="large"
                className={fr.cx('fr-mb-4v')}
              >
                Demander l'accès à Otelo
              </Button>
            </div>
            <p className={fr.cx('fr-text--xs', 'fr-text--alt')}>Vous serez redirigé vers le formulaire de demande d'accès.</p>
          </div>
        </div>
      </div>
    </div>
  )
}
