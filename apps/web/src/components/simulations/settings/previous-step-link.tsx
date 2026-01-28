'use client'

import Button from '@codegouvfr/react-dsfr/Button'
import Link from 'next/link'
import { useParams, usePathname, useSearchParams } from 'next/navigation'
import { FC } from 'react'

type PreviousStepLinkProps = {
  label?: string
}

// Mapping of current step to previous step
const PREVIOUS_STEP_MAP: Record<string, string> = {
  // Creation flow
  'cadrage-temporel': '/simulation/choix-du-territoire',
  'parametrages-demographique': '/simulation/cadrage-temporel',
  'taux-cibles-logements-vacants': '/simulation/parametrages-demographique',
  'taux-cibles-residences-secondaires': '/simulation/taux-cibles-logements-vacants',
  'taux-restructuration-disparition': '/simulation/taux-cibles-residences-secondaires',
}

export const PreviousStepLink: FC<PreviousStepLinkProps> = ({ label = 'Précédent' }) => {
  const pathname = usePathname()
  const params = useParams()
  const searchParams = useSearchParams()
  const searchParamsString = new URLSearchParams(searchParams).toString()

  // Extract the current step from pathname
  const pathParts = pathname.split('/')
  const currentStep = pathParts[pathParts.length - 1]

  // Determine if we're in modification mode
  const isModification = pathname.includes('/modifier/')
  const simulationId = isModification ? params.id : null

  // Get the base previous step
  let previousHref = PREVIOUS_STEP_MAP[currentStep]

  if (!previousHref) {
    // If no mapping found, just return null (no button)
    return null
  }

  // Adjust for modification flow
  if (isModification && simulationId) {
    // For modification flow, prefix with /simulation/[id]/modifier
    // Exception: cadrage-temporel should go back to results page
    if (currentStep === 'cadrage-temporel') {
      previousHref = `/simulation/${simulationId}/resultats`
    } else {
      // Replace /simulation/ with /simulation/[id]/modifier/
      previousHref = previousHref.replace('/simulation/', `/simulation/${simulationId}/modifier/`)
    }
  }

  // Append search params
  const hrefWithParams = `${previousHref}${searchParamsString ? `?${searchParamsString}` : ''}`

  return (
    <Link href={hrefWithParams}>
      <Button priority="secondary" size="large" iconId="ri-arrow-left-line" iconPosition="left">
        {label}
      </Button>
    </Link>
  )
}
