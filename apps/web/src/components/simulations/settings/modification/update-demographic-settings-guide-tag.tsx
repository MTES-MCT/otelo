'use client'

import { fr, RiIconClassName } from '@codegouvfr/react-dsfr'
import { Tag } from '@codegouvfr/react-dsfr/Tag'
import { useSearchParams } from 'next/navigation'
import { FC } from 'react'
import { tss } from 'tss-react'
import { useSimulationSettings } from '~/app/(authenticated)/simulation/[id]/modifier/(demographic-modification)/simulation-scenario-modification-provider'
import { formatDecohabitation, formatScenario } from '~/utils/omphale-label'

interface UpdateGuideTagProps {
  step: {
    data?: string | Array<string>
    disabled?: boolean
    iconId?: string
    path: string
    queryKeys: Array<string>
    titleText: string
  }
}

export const UpdateDemographicSettingsGuideTag: FC<UpdateGuideTagProps> = ({ step }) => {
  const { data, disabled = false, path, queryKeys, iconId = 'fr-icon-checkbox-circle-line' } = step
  const { simulationSettings } = useSimulationSettings()
  const { classes } = useStyles({ disabled, queryKeys })
  const searchParams = useSearchParams()
  const newSearchParams = new URLSearchParams(searchParams.toString())
  const href = `${path}${newSearchParams.toString() ? `?${newSearchParams.toString()}` : ''}`

  // Handle Omphale case with two separate tags
  if (queryKeys.includes('omphale') && simulationSettings.b2_scenario) {
    const scenario = simulationSettings.b2_scenario.split('_')[0]
    const decohabitation = simulationSettings.b2_scenario.split('_')[1]

    const formattedScenario = formatScenario(scenario, true)
    const formattedDecohabitation = formatDecohabitation(decohabitation, true)

    return (
      <>
        <Tag className={classes.tag} iconId="ri-group-line" linkProps={{ href }}>
          Population: {formattedScenario}
        </Tag>
        <Tag className={classes.tag} iconId="ri-home-4-line" linkProps={{ href }}>
          Ménages: {formattedDecohabitation}
        </Tag>
      </>
    )
  }

  // Handle rates display for taux-cibles steps
  // Don't render anything here - handled by update-demographic-settings-simulation-side-menu.tsx
  if (path.includes('taux-cibles-logements-vacants')) {
    return null
  }

  if (path.includes('taux-cibles-residences-secondaires')) {
    return null
  }

  if (path.includes('taux-restructuration-disparition')) {
    return null
  }

  // Handle projection data
  if (queryKeys.includes('projection') && data) {
    return (
      <Tag className={classes.tag} iconId={iconId as RiIconClassName} linkProps={{ href }}>
        {data}
      </Tag>
    )
  }

  // Default fallback - no tag displayed
  return null
}

const useStyles = tss.withParams<{ disabled: boolean; queryKeys: string[] }>().create(({ disabled }) => {
  let backgroundColor = undefined
  let hoverBackgroundColor = undefined
  let color = undefined

  if (disabled) {
    backgroundColor = `${fr.colors.decisions.background.disabled.grey.default} !important`
    hoverBackgroundColor = undefined
    color = `${fr.colors.decisions.text.disabled.grey.default} !important`
  }

  return {
    tag: {
      '&:hover': {
        backgroundColor: hoverBackgroundColor,
      },
      backgroundColor,
      color,
      cursor: disabled ? 'not-allowed' : undefined,
    },
  }
})
