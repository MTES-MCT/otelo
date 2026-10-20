import classNames from 'classnames'
import { FC, ReactNode } from 'react'
import { type TutorialAnchor, tutorialAnchor } from '~/components/simulations/tutorial/tutorial-content'
import styles from './scenario-panel.module.css'

type ScenarioPanelProps = {
  /** Sans contenu, la colonne annonce ce qu'elle accueillera. */
  children?: ReactNode
  anchor: TutorialAnchor
}

/** Colonne « Votre scénario » : elle récapitule la saisie et l'estimation au fil des étapes. */
export const ScenarioPanel: FC<ScenarioPanelProps> = ({ children, anchor }) => (
  <section className={classNames(styles.panel, 'shadow')} aria-labelledby="scenario-panel-title" {...tutorialAnchor(anchor)}>
    <h2 id="scenario-panel-title" className={classNames(styles.title, 'fr-h6')}>
      <span className="ri-line-chart-line" aria-hidden />
      Votre scénario
    </h2>
    {children ?? <p className="fr-text--sm fr-text-mention--grey fr-mb-0">Votre estimation se construira ici à chaque étape.</p>}
  </section>
)

type ScenarioPeriodProps = {
  start: string | number | null
  end: number | null
}

export const ScenarioPeriod: FC<ScenarioPeriodProps> = ({ start, end }) => (
  <p className={styles.period}>
    {start} <span aria-hidden>→</span>
    <span className="fr-sr-only">à</span> {end}
  </p>
)
