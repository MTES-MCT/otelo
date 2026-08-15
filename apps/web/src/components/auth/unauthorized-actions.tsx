'use client'

import { fr } from '@codegouvfr/react-dsfr'
import Button from '@codegouvfr/react-dsfr/Button'
import type { FC } from 'react'
import { trackEvent } from '~/lib/tracking'

const DEMARCHES_SIMPLIFIEES_URL = 'https://www.demarches-simplifiees.fr/commencer/acces-a-otelo'

/**
 * N3 — actions du mur d'engagement.
 *
 * C'est la plus grosse fuite de l'entonnoir d'activation : un compte créé qui ne signe
 * jamais l'acte n'obtient pas d'accès et n'apparaît qu'en « jamais connecté » côté base,
 * sans qu'on sache s'il a seulement tenté la démarche. Ces deux clics le disent.
 */
export const UnauthorizedActions: FC = () => (
  <>
    <div>
      <Button
        className={fr.cx('fr-mb-4v')}
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
        className={fr.cx('fr-mb-4v')}
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
