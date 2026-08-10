'use client'

import { usePathname } from 'next/navigation'
import { FC, ReactNode } from 'react'
import { getFlowFromPathname, getSlugFromPathname, getStepIndex } from '~/components/simulations/settings/wizard-steps'
import { StepQuestionsCard } from './step-questions-card'
import styles from './wizard-aside.module.css'

type WizardAsideProps = {
  /** Slot d'estimation : chaque parcours y injecte le wrapper de preview qui lui correspond. */
  children?: ReactNode
}

/** Première étape de création portant la colonne : « Affiner la projection démographique ». */
const FIRST_CREATION_STEP_WITH_ASIDE = 2

export const WizardAside: FC<WizardAsideProps> = ({ children }) => {
  const pathname = usePathname()
  const flow = getFlowFromPathname(pathname)
  const slug = getSlugFromPathname(pathname)

  if (!slug) {
    return null
  }

  // En création, le territoire et l'horizon n'ont encore rien à estimer ni à expliquer en colonne.
  // En modification, le parcours commence à l'horizon et tout est déjà paramétré : la colonne suit dès la première étape.
  if (flow === 'creation' && getStepIndex(slug, flow) < FIRST_CREATION_STEP_WITH_ASIDE) {
    return null
  }

  return (
    <aside className={styles.aside}>
      <div className={styles.sticky}>
        <StepQuestionsCard slug={slug} />
        {children}
      </div>
    </aside>
  )
}
