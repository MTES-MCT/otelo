'use client'

import { FrIconClassName, fr, RiIconClassName } from '@codegouvfr/react-dsfr'
import { Tag } from '@codegouvfr/react-dsfr/Tag'
import { useSearchParams } from 'next/navigation'
import { useQueryState } from 'nuqs'
import { FC } from 'react'
import { tss } from 'tss-react'
import { formatDecohabitation, formatScenario } from '~/utils/omphale-label'

interface CreationGuideTagProps {
  step: {
    data?: string | Array<string>
    disabled?: boolean
    iconId?: string
    path: string
    queryKeys: Array<string>
  }
}

interface CreationGuideTargetTagProps {
  step: {
    value: string
    path: string
    disabled?: boolean
    iconId: RiIconClassName | FrIconClassName
  }
}

export const DemographicTargetTag: FC<CreationGuideTargetTagProps> = ({ step }) => {
  const { path, iconId, value } = step
  const searchParams = useSearchParams()
  const newSearchParams = new URLSearchParams(searchParams.toString())
  const href = `${path}${newSearchParams.toString() ? `?${newSearchParams.toString()}` : ''}`

  return (
    <Tag iconId={iconId} linkProps={{ href }}>
      {value}
    </Tag>
  )
}

export const DemographicSettingsGuideTag: FC<CreationGuideTagProps> = ({ step }) => {
  const { data, disabled = false, path, queryKeys, iconId = 'fr-icon-checkbox-circle-line' } = step
  const [value] = useQueryState(queryKeys[0])

  const { classes } = useStyles({ disabled, value, queryKeys })
  const searchParams = useSearchParams()
  const newSearchParams = new URLSearchParams(searchParams.toString())
  const href = `${path}${newSearchParams.toString() ? `?${newSearchParams.toString()}` : ''}`

  // Handle horizon de temps display
  if (path === '/simulation/cadrage-temporel' && value) {
    return (
      <Tag className={classes.tag} iconId="ri-time-line" linkProps={{ href }}>
        2021 - {value}
      </Tag>
    )
  }

  if (queryKeys.includes('omphale')) {
    if (value) {
      const scenario = value.split('_')[0]
      const decohabitation = value.split('_')[1]

      const formattedScenario = formatScenario(scenario, true)
      const formattedDecohabitation = formatDecohabitation(decohabitation, true)

      return (
        <>
          <Tag className={classes.tag} iconId="ri-group-line" linkProps={{ href }}>
            Population : {formattedScenario}
          </Tag>
          <Tag className={classes.tag} iconId="ri-home-4-line" linkProps={{ href }}>
            Ménages : {formattedDecohabitation}
          </Tag>
        </>
      )
    }
  }

  let formattedValue = value && Number(value) < 1 ? (Number(value) * 100).toFixed(2) : value
  if (data && typeof data === 'string') {
    formattedValue = data
  }

  const defaultTagProps = {
    value: formattedValue,
  }

  const tagProps = {
    iconId: iconId as RiIconClassName,
    ...defaultTagProps,
    linkProps: {
      href,
    },
  }

  // EPCIS
  if (data && Array.isArray(data)) {
    return data.map((item) => (
      <Tag key={item} iconId="ri-map-pin-2-line" className={classes.tag} linkProps={{ href }}>
        {item}
      </Tag>
    ))
  }
  if (formattedValue && !Array.isArray(data)) {
    return (
      <Tag className={classes.tag} {...tagProps}>
        {formattedValue}
      </Tag>
    )
  }
}

const useStyles = tss
  .withParams<{ disabled: boolean; value: string | null; queryKeys: string[] }>()
  .create(({ disabled, value, queryKeys }) => {
    let backgroundColor = undefined
    let hoverBackgroundColor = undefined
    let color = undefined

    if (!value && queryKeys.length === 1) {
      backgroundColor = `${fr.colors.decisions.background.contrast.grey.default} !important`
      hoverBackgroundColor = `${fr.colors.decisions.background.contrast.grey.hover} !important`
      color = `${fr.colors.decisions.text.default.grey.default} !important`
    }

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
