'use client'

import Button from '@codegouvfr/react-dsfr/Button'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { parseAsString, useQueryStates } from 'nuqs'
import { FC } from 'react'

type NextStepLinkProps = {
  defaultValue?: string
  href: string
  label?: string
  query: string
  isDisabled?: boolean
  priority?: 'secondary' | 'primary' | 'tertiary' | 'tertiary no outline' | undefined
  touchedQueryParam?: string
}

export const NextStepLinkWithoutValidation: FC<Pick<NextStepLinkProps, 'href' | 'label' | 'priority'>> = ({ href, label = 'Suivant' }) => {
  const searchParams = useSearchParams()
  const searchParamsString = new URLSearchParams(searchParams).toString()
  const hrefWithParams = `${href}${searchParamsString ? `?${searchParamsString}` : ''}`
  return (
    <Button linkProps={{ href: hrefWithParams }} size="large" iconId="ri-arrow-right-line" iconPosition="right">
      {label}
    </Button>
  )
}

export const NextStepLink: FC<NextStepLinkProps> = ({ defaultValue, href, label = 'Suivant', query, isDisabled, touchedQueryParam }) => {
  const [queryState, setQueryState] = useQueryStates({
    [query]: parseAsString.withDefault(defaultValue ?? ''),
    ...(touchedQueryParam ? { [touchedQueryParam]: parseAsString } : {}),
  })
  const searchParams = useSearchParams()
  const searchParamsString = new URLSearchParams(searchParams).toString()
  const hrefWithParams = `${href}${searchParamsString ? `?${searchParamsString}` : ''}`

  const value = queryState[query]
  const disabled = isDisabled || !value

  const handleClick = () => {
    if (disabled && touchedQueryParam) {
      setQueryState({ [touchedQueryParam]: 'true' })
    }
  }

  if (disabled) {
    return (
      <Button disabled size="large" iconId="ri-arrow-right-line" iconPosition="right" onClick={handleClick}>
        {label}
      </Button>
    )
  }

  return (
    <Link href={hrefWithParams}>
      <Button size="large" iconId="ri-arrow-right-line" iconPosition="right">
        {label}
      </Button>
    </Link>
  )
}
