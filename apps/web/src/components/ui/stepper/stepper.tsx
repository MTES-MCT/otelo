import classNames from 'classnames'
import Link from 'next/link'
import { FC } from 'react'
import styles from './stepper.module.css'

export type StepperStep = {
  label: string
  /** Lien de l'étape, suivi seulement une fois l'étape complétée : on ne saute jamais en avant. */
  href?: string
}

type StepperProps = {
  steps: readonly StepperStep[]
  /** Rang de l'étape en cours, à partir de 0. `steps.length` marque toutes les étapes complétées. */
  currentIndex: number
  ariaLabel?: string
  className?: string
}

type StepState = 'complete' | 'active' | 'upcoming'

const STATE_LABELS: Record<StepState, string> = {
  active: 'étape en cours',
  complete: 'étape complétée',
  upcoming: 'étape à venir',
}

const getStepState = (index: number, currentIndex: number): StepState => {
  if (index < currentIndex) return 'complete'
  if (index === currentIndex) return 'active'
  return 'upcoming'
}

/**
 * Stepper horizontal générique : une pastille numérotée par étape, reliées par un trait.
 *
 * Il ne connaît aucun parcours : chaque parcours lui passe ses étapes et le rang courant.
 */
export const Stepper: FC<StepperProps> = ({ steps, currentIndex, ariaLabel = 'Étapes du parcours', className }) => (
  <nav aria-label={ariaLabel} className={className}>
    <ol className={styles.list}>
      {steps.map((step, index) => {
        const state = getStepState(index, currentIndex)
        const content = (
          <>
            <span className={styles.bullet} aria-hidden>
              {index + 1}
            </span>
            <span className={styles.label}>
              {step.label}
              <span className="fr-sr-only"> — {STATE_LABELS[state]}</span>
            </span>
          </>
        )

        return (
          <li key={step.label} className={classNames(styles.step, styles[state])} aria-current={state === 'active' ? 'step' : undefined}>
            {state === 'complete' && step.href ? (
              <Link href={step.href} className={styles.content}>
                {content}
              </Link>
            ) : (
              <span className={styles.content}>{content}</span>
            )}
          </li>
        )
      })}
    </ol>
  </nav>
)
