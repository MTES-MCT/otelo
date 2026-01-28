'use client'

import { fr } from '@codegouvfr/react-dsfr'
import { Tag } from '@codegouvfr/react-dsfr/Tag'
import { useSearchParams } from 'next/navigation'
import { FC } from 'react'
import { tss } from 'tss-react'

interface CreationGuideTagProps {
  step: {
    disabled?: boolean
    label: string
    path: string
    value?: string
  }
}

export const BadHousingSettingsCreationGuideTag: FC<CreationGuideTagProps> = ({ step }) => {
  const { disabled = false, label, path, value } = step
  const { classes } = useStyles({ disabled, value })
  const searchParams = useSearchParams()
  const newSearchParams = new URLSearchParams(searchParams.toString())
  const href = `${path}${newSearchParams.toString() ? `?${newSearchParams.toString()}` : ''}`

  const formattedValue = value && Number(value) < 1 ? (Number(value) * 100).toFixed(2) : value

  const defaultTagProps = {
    value: formattedValue,
  }

  const tagProps = value
    ? {
        iconId: 'fr-icon-checkbox-circle-line' as const,
        ...defaultTagProps,
        linkProps: {
          href,
        },
      }
    : defaultTagProps

  return (
    <Tag iconId="fr-icon-question-line" className={classes.tag} {...tagProps}>
      {formattedValue ?? label}
    </Tag>
  )
}

const useStyles = tss.withParams<{ disabled: boolean; value: string | undefined }>().create(({ disabled, value }) => {
  let backgroundColor = undefined
  let hoverBackgroundColor = undefined
  let color = undefined

  if (!value) {
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
