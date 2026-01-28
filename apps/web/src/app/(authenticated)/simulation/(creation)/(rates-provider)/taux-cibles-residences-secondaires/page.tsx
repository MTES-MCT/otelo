import type { Metadata } from 'next'
import { SearchParams } from 'nuqs'
import { searchParamsCache } from '~/app/(authenticated)/simulation/(creation)/searchParams'
import { CreateEpcisSecondaryAccommodationRates } from '~/components/simulations/settings/epcis-accommodation-rates/create-epcis-secondary-accommodation-rates'
import { NextStepLink } from '~/components/simulations/settings/next-step-link'
import { PreviousStepLink } from '~/components/simulations/settings/previous-step-link'
import { getEpcis } from '~/server-only/epcis/get-epcis'

export const metadata: Metadata = {
  title: 'Élaborer scénario - étape 5 sur 6 - Otelo',
}

type PageProps = {
  searchParams: Promise<SearchParams>
}

export default async function TargetSecondaryResidencesRates({ searchParams }: PageProps) {
  const { epcis, baseEpci } = await searchParamsCache.parse(searchParams)
  const simulationsEpcis = await getEpcis(epcis, baseEpci)
  const href = `/simulation/taux-restructuration-disparition`

  return (
    <>
      <div className="fr-flex fr-direction-column fr-background-default--grey shadow">
        <CreateEpcisSecondaryAccommodationRates epcis={simulationsEpcis} />
      </div>
      <div className="fr-flex fr-flex-gap-6v fr-justify-content-end fr-py-4w fr-px-2w">
        <PreviousStepLink />
        <NextStepLink href={href} query="omphale" />
      </div>
    </>
  )
}
