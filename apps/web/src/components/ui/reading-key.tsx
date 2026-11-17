import CallOut from '@codegouvfr/react-dsfr/CallOut'
import classNames from 'classnames'
import { FC, ReactNode } from 'react'

/**
 * Clé de lecture du parcours : traduit en phrase la valeur que l'utilisateur vient de choisir.
 *
 * Sans badge ni titre : la mise en exergue du CallOut suffit à la distinguer, et des marges
 * resserrées la gardent dans le fil de lecture plutôt qu'en encart à part.
 */
export const ReadingKey: FC<{ children: ReactNode; className?: string }> = ({ children, className }) => (
  <CallOut className={classNames('fr-py-2w fr-px-3w fr-mb-0', className)}>
    <span className="fr-text--md">{children}</span>
  </CallOut>
)
