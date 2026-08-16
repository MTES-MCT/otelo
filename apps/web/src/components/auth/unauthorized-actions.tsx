'use client'

import Button from '@codegouvfr/react-dsfr/Button'
import type { FC } from 'react'
import { trackEvent } from '~/lib/tracking'

const DEMARCHES_SIMPLIFIEES_URL = 'https://www.demarches-simplifiees.fr/commencer/acces-a-otelo'

export const UnauthorizedActions: FC = () => (
  <>
    <div>
      <Button
        className="fr-mb-4v"
        linkProps={{
          href: '/assets/pdf/acte_engagement.pdf',
          onClick: () => trackEvent({ action: 'mur acces', category: 'Authentification', name: 'telechargement acte' }),
          target: '_blank',
        }}
        priority="tertiary"
        size="large"
      >
        Télécharger l'acte d'engagement
      </Button>
    </div>
    <div>
      <Button
        className="fr-mb-4v"
        linkProps={{
          href: DEMARCHES_SIMPLIFIEES_URL,
          onClick: () => trackEvent({ action: 'mur acces', category: 'Authentification', name: 'demarches-simplifiees' }),
          target: '_blank',
        }}
        priority="primary"
        size="large"
      >
        Demander l'accès à Otelo
      </Button>
    </div>
  </>
)
