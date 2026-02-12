import type { Metadata } from 'next'
import { SearchParams } from 'nuqs'
import { searchParamsCache } from '~/app/(authenticated)/simulation/(creation)/searchParams'
import { DataSourceLink } from '~/components/simulations/settings/data-source-link'
import { CreateRestructurationDisparitionRates } from '~/components/simulations/settings/restructuration-disparition-rates/create-restructuration-disparition-rates'
import { RestructurationDisparitionFooter } from '~/components/simulations/settings/restructuration-disparition-rates/restructuration-disparition-footer'
import { getEpcis } from '~/server-only/epcis/get-epcis'

export const metadata: Metadata = {
  title: 'Elaborer scenario - étape 5 sur 6 - Otelo',
}

type PageProps = {
  searchParams: Promise<SearchParams>
}

export default async function RestructurationDisparitionRatesPage({ searchParams }: PageProps) {
  const { epcis, baseEpci } = await searchParamsCache.parse(searchParams)
  const simulationsEpcis = await getEpcis(epcis, baseEpci)

  return (
    <>
      <div className="fr-flex fr-direction-column fr-background-default--grey">
        <CreateRestructurationDisparitionRates epcis={simulationsEpcis} />
      </div>
      <div className="fr-px-2w fr-pt-2w">
        <DataSourceLink anchor="#taux-restructuration-disparition" />
      </div>
      <RestructurationDisparitionFooter />
    </>
  )
}
