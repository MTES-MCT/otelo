'use client'

import classNames from 'classnames'
import { usePathname } from 'next/navigation'
import styles from './simulation-side-menu.module.css'

export const DemographicSettingsSimulationSideMenuStepNumber = ({
  stepNumber,
  path,
  allSteps,
}: {
  stepNumber: number
  path: string
  allSteps: { path: string }[]
}) => {
  const pathname = usePathname()
  const isCurrentPath = pathname.includes(path)

  // Find current step index
  const currentStepIndex = allSteps.findIndex((step) => pathname.includes(step.path))
  const isCompleted = currentStepIndex > -1 && stepNumber - 1 < currentStepIndex

  return (
    <div
      className={classNames({
        [styles.stepNumberActive]: isCurrentPath,
        [styles.stepNumberCompleted]: isCompleted,
        [styles.stepNumberInactive]: !isCurrentPath && !isCompleted,
      })}
    >
      <span className={styles.stepNumberText}>{stepNumber}</span>
    </div>
  )
}
