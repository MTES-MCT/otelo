import type { FC, ReactNode } from 'react'
import styles from '~/app/(authenticated)/admin/admin.module.css'

type AdminPageHeaderProps = {
  /** Classe d'icône DSFR, ex. `fr-icon-dashboard-3-line`. */
  icon: string
  title: string
  subtitle?: string
  /** Actions alignées à droite du titre (export, bouton primaire...). */
  actions?: ReactNode
}

export const AdminPageHeader: FC<AdminPageHeaderProps> = ({ actions, icon, subtitle, title }) => (
  <div className="fr-mb-3w">
    <div className="fr-flex fr-align-items-center fr-flex-gap-2v">
      <div className={styles.pageIcon}>
        <span className={`${icon} ${styles.pageIconBadge}`} aria-hidden="true" />
      </div>
      <h1 className="fr-h3 fr-mb-0">{title}</h1>
      {actions && <div className="fr-ml-auto fr-flex fr-flex-gap-2v">{actions}</div>}
    </div>
    {subtitle && <p className="fr-text--sm fr-text-mention--grey fr-mt-1v fr-mb-0">{subtitle}</p>}
  </div>
)
