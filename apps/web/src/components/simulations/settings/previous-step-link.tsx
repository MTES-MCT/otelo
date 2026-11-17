'use client'

import Button from '@codegouvfr/react-dsfr/Button'
import Link from 'next/link'
import { useParams, usePathname, useSearchParams } from 'next/navigation'
import { FC } from 'react'
import { buildStepPath, getFlowFromPathname, getSlugFromPathname, getStepIndex, getStepsForFlow } from './wizard-steps'

type PreviousStepLinkProps = {
  label?: string
}

export const PreviousStepLink: FC<PreviousStepLinkProps> = ({ label = 'Précédent' }) => {
  const pathname = usePathname()
  const params = useParams()
  const searchParams = useSearchParams()
  const searchParamsString = new URLSearchParams(searchParams).toString()

  const flow = getFlowFromPathname(pathname)
  const steps = getStepsForFlow(flow)
  const currentIndex = getStepIndex(getSlugFromPathname(pathname), flow)
  const simulationId = flow === 'modification' ? String(params.id) : undefined

  // Hors du parcours : pas de bouton.
  if (currentIndex === -1) {
    return null
  }

  // On entre en modification depuis les résultats : la première étape y ramène.
  // En création, rien ne précède la première étape.
  const previousHref =
    currentIndex === 0
      ? flow === 'modification' && simulationId
        ? `/simulation/${simulationId}/resultats`
        : null
      : buildStepPath(steps[currentIndex - 1].slug, flow, simulationId)

  if (!previousHref) {
    return null
  }

  const hrefWithParams = `${previousHref}${searchParamsString ? `?${searchParamsString}` : ''}`

  return (
    <Link href={hrefWithParams}>
      <Button priority="secondary" size="large" iconId="ri-arrow-left-line" iconPosition="left">
        {label}
      </Button>
    </Link>
  )
}
