'use client'

import classNames from 'classnames'
import { usePathname } from 'next/navigation'

export const DemographicSettingsSimulationSideMenuTitle = ({
  title,
  path,
  stepNumber,
  allSteps,
}: {
  title: string
  path: string
  stepNumber: number
  allSteps: { path: string }[]
}) => {
  const pathname = usePathname()
  const isCurrentPath = pathname.includes(path)

  const currentStepIndex = allSteps.findIndex((step) => pathname.includes(step.path))
  const isCompleted = currentStepIndex > -1 && stepNumber - 1 < currentStepIndex

  return (
    <span
      className={classNames({
        'fr-text--bold': isCurrentPath,
        'fr-text--medium': isCompleted,
      })}
    >
      {title}
    </span>
  )
}
