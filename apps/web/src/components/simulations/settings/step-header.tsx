import classNames from 'classnames'
import { FC, ReactNode } from 'react'
import styles from './step-header.module.css'

type StepHeaderProps = {
  /** Absent sur un récapitulatif, qui n'est pas une étape numérotée. */
  position?: { current: number; total: number }
  title: string
  description?: string
  /** Bouton du didacticiel, en haut à droite. */
  action?: ReactNode
}

/** En-tête de la carte d'étape : le contenu de la page se colle dessous, séparé par une bordure. */
export const StepHeader: FC<StepHeaderProps> = ({ position, title, description, action }) => (
  <div className={classNames(styles.header, 'fr-px-2w fr-py-2w fr-px-md-5w fr-py-md-3w shadow')}>
    <div className={styles.text}>
      {position && (
        <p className="fr-text--sm fr-text-mention--grey fr-mb-1v">
          Étape {position.current} sur {position.total}
        </p>
      )}
      <h1 className="fr-h4 fr-mb-0">{title}</h1>
      {description && <p className="fr-text--sm fr-text-mention--grey fr-mt-1w fr-mb-0">{description}</p>}
    </div>
    {action && <div className={styles.action}>{action}</div>}
  </div>
)
