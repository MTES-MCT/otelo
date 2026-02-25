import Alert from '@codegouvfr/react-dsfr/Alert'
import type { Metadata } from 'next'
import { SearchParams } from 'nuqs'
import { searchParamsCache } from '~/app/(authenticated)/simulation/(creation)/searchParams'
import { ChartDownloadWrapper } from '~/components/charts/chart-download-wrapper'
import { OmphaleScenariosChart } from '~/components/charts/omphale-scenarios-chart'
import { PopulationScenariosChart } from '~/components/charts/population-scenarios-chart'
import { DataSourceLink } from '~/components/simulations/settings/data-source-link'
import { DemographicSettingsHeader } from '~/components/simulations/settings/demographic-settings-header'
import { NextStepLink } from '~/components/simulations/settings/next-step-link'
import { PreviousStepLink } from '~/components/simulations/settings/previous-step-link'
import { getEpcisWithoutInseeProjection } from '~/server-only/demographic-evolution/get-epcis-without-insee-projection'
import { getOmphaleDemographicEvolutionByEpci } from '~/server-only/demographic-evolution/get-omphale-evolution-by-epci'
import { getPopulationDemographicEvolutionByEpci } from '~/server-only/demographic-evolution/get-population-evolution-by-epci'

export const metadata: Metadata = {
  title: 'Elaborer scenario - étape 3 sur 6 - Otelo',
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
  const hasEpcisWithoutInseeProjection = epcisWithoutInseeProjection.length > 0

  return (
    <>
      {hasEpcisWithoutInseeProjection && (
        <div className="fr-py-2w fr-pt-2w">
          <Alert
            severity="warning"
            small
            description={
              <>
                Pour ce territoire, l'INSEE ne propose pas de projections démographiques robustes. Les projections affichées ont été
                recalculées en ventilant les projections départementales — ménages ou population — au prorata du poids de l'EPCI dans le
                département.{' '}
                <a href="/guide#elaboration-projections" target="_blank" rel="noopener noreferrer">
                  En savoir plus
                </a>
              </>
            }
          />
        </div>
      )}
      <div className="fr-flex fr-direction-column fr-background-default--grey shadow">
        <DemographicSettingsHeader>
          <ChartDownloadWrapper fileName="scenarios-population">
            <PopulationScenariosChart demographicEvolution={populationEvolution} />
          </ChartDownloadWrapper>
          <ChartDownloadWrapper fileName="scenarios-omphale">
            <OmphaleScenariosChart demographicEvolution={omphaleEvolution} />
          </ChartDownloadWrapper>
        </DemographicSettingsHeader>
      </div>
      <div className="fr-px-2w fr-pt-2w">
        <DataSourceLink anchor="#projections-demographiques" />
      </div>
      <div className="fr-flex fr-flex-gap-6v fr-justify-content-end fr-py-4w fr-px-2w">
        <PreviousStepLink />
        <NextStepLink href={href} query="omphale" touchedQueryParam="omphaleTouched" />
      </div>
    </>
  )
}
