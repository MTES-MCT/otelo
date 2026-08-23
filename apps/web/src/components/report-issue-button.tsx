'use client'

import { fr } from '@codegouvfr/react-dsfr'
import { usePathname } from 'next/navigation'
import { FC } from 'react'
import { trackEvent } from '~/lib/tracking'
import { CONTACT_EMAIL } from '~/utils/resources'

const SUBJECT = '[Otelo] Signalement d’un problème'

const buildBody = (pathname: string): string =>
  ['Décrivez ci-dessous le problème rencontré :', '', '', '—', `Page concernée : ${pathname}`].join('\n')

/**
 * Ouvre le client mail de l'utilisateur sur un signalement pré-rempli.
 *
 * Un `<a href="mailto:">` et non un `<Button linkProps>` : DSFR route ses liens par `next/link`,
 * inutile pour un `mailto:`. C'est aussi la forme employée partout ailleurs pour `CONTACT_EMAIL`.
 *
 * Le chemin de la page est repris dans le corps du message — sans lui, un signalement arrive
 * sans contexte et l'échange coûte un aller-retour. Il part par le client mail de l'utilisateur,
 * vers l'équipe uniquement ; l'événement Matomo, lui, ne transporte aucun chemin (un lien de
 * partage exposerait son jeton).
 */
export const ReportIssueButton: FC = () => {
  const pathname = usePathname()
  const href = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(SUBJECT)}&body=${encodeURIComponent(buildBody(pathname))}`

  return (
    <a
      className={fr.cx('fr-btn', 'fr-btn--tertiary-no-outline', 'fr-icon-feedback-line', 'fr-btn--icon-left', 'fr-mb-0')}
      href={href}
      onClick={() => trackEvent({ action: 'signalement probleme', category: 'Engagement' })}
    >
      Signaler un problème
    </a>
  )
}
