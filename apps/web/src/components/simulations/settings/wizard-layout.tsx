import { FC, ReactNode } from 'react'
import { AuthenticatedBreadcrumb } from '~/components/breadcrumbs/authenticated-breadcrumb'
import styles from './wizard-layout.module.css'

type WizardLayoutProps = {
  stepper: ReactNode
  /** Colonne « Votre scénario ». */
  panel: ReactNode
  /** En-tête de la carte d'étape, au-dessus du contenu de la page. */
  header: ReactNode
  children: ReactNode
}

/** Gabarit commun aux parcours de paramétrage : création, modification et mal-logement. */
export const WizardLayout: FC<WizardLayoutProps> = ({ stepper, panel, header, children }) => (
  <div className={styles.container}>
    <AuthenticatedBreadcrumb />
    <div className="fr-mb-4w">{stepper}</div>
    <div className={styles.columns}>
      <div className={styles.panelColumn}>{panel}</div>
      <main className={styles.mainColumn}>
        {header}
        {children}
      </main>
    </div>
  </div>
)
