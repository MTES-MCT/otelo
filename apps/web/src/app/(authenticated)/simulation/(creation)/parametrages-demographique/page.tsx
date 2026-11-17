import type { Metadata } from 'next'
import { SearchParams } from 'nuqs'
import { searchParamsCache } from '~/app/(authenticated)/simulation/(creation)/searchParams'
import { ChartDownloadWrapper } from '~/components/charts/chart-download-wrapper'
import { OmphaleScenariosChart } from '~/components/charts/omphale-scenarios-chart'
import { PopulationScenariosChart } from '~/components/charts/population-scenarios-chart'
import { PrefetchCreationSimulationPreview } from '~/components/simulations/preview/prefetch-creation-simulation-preview'
import { DataSourceLink } from '~/components/simulations/settings/data-source-link'
import { DemographicSettingsHeader } from '~/components/simulations/settings/demographic-settings-header'
import { DemographicNextStep } from '~/components/simulations/settings/demographic-transition-modal'
import { FragileProjectionAlert } from '~/components/simulations/settings/fragile-projection-alert'
import { InfographieLink } from '~/components/simulations/settings/infographie-link'
import { PreviousStepLink } from '~/components/simulations/settings/previous-step-link'
import { getEpcisWithoutInseeProjection } from '~/server-only/demographic-evolution/get-epcis-without-insee-projection'
import { getOmphaleDemographicEvolutionByEpci } from '~/server-only/demographic-evolution/get-omphale-evolution-by-epci'
import { getPopulationDemographicEvolutionByEpci } from '~/server-only/demographic-evolution/get-population-evolution-by-epci'

export const metadata: Metadata = {
  title: 'Élaborer un scénario - étape 3 sur 6 - Otelo',
}

type PageProps = {
  searchParams: Promise<SearchParams>
}

export default async function DemographicSettingsPage({ searchParams }: PageProps) {
  const { epcis, millesime } = await searchParamsCache.parse(searchParams)
  const [omphaleEvolution, populationEvolution, epcisWithoutInseeProjection] = await Promise.all([
    getOmphaleDemographicEvolutionByEpci(epcis, millesime),
    getPopulationDemographicEvolutionByEpci(epcis, millesime),
    getEpcisWithoutInseeProjection(epcis),
  ])
  const href = `/simulation/taux-cibles-logements-vacants`

  return (
    <>
      <PrefetchCreationSimulationPreview />
      <div className="fr-flex fr-direction-column fr-background-default--grey shadow">
        <DemographicSettingsHeader notice={<FragileProjectionAlert epciCodes={epcisWithoutInseeProjection} epcisCount={epcis.length} />}>
          <ChartDownloadWrapper fileName="scenarios-population" withFloatingButton={false}>
            <PopulationScenariosChart demographicEvolution={populationEvolution} />
          </ChartDownloadWrapper>
          <ChartDownloadWrapper fileName="scenarios-omphale" withFloatingButton={false}>
            <OmphaleScenariosChart demographicEvolution={omphaleEvolution} fragileEpciCodes={epcisWithoutInseeProjection} />
          </ChartDownloadWrapper>
        </DemographicSettingsHeader>
      </div>
      <div className="fr-flex fr-flex-gap-2v fr-px-2w fr-pt-2w">
        <InfographieLink />
        <DataSourceLink anchor="#projections-demographiques" />
      </div>
      <div className="fr-flex fr-flex-gap-6v fr-justify-content-end fr-py-4w fr-px-2w">
        <PreviousStepLink />
        <DemographicNextStep href={href} />
      </div>
    </>
  )
}
