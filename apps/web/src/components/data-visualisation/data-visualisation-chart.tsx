import { FC } from 'react'
import { BadHousingChart } from '~/components/charts/data-visualisation/bad-housing-charts'
import { HouseholdSizesChart } from '~/components/charts/data-visualisation/household-sizes-chart'
import { LovacAccommodationEvolutionChart } from '~/components/charts/data-visualisation/lovac-evolution-charts'
import { PopulationEvolutionChart } from '~/components/charts/data-visualisation/population-evolution-charts'
import { ProjectionMenagesEvolutionChart } from '~/components/charts/data-visualisation/projection-menages-evolution-charts'
import { ProjectionPopulationEvolutionChart } from '~/components/charts/data-visualisation/projection-population-evolution-charts'
import { RPAccommodationEvolutionChart } from '~/components/charts/data-visualisation/rp-accommodation-evolution-charts'
import { SitadelChart } from '~/components/charts/data-visualisation/sitadel-chart'
import { TAccommodationEvolution, TAccommodationLovacEvolution } from '~/schemas/accommodation-evolution'
import { THouseholdSizesChart } from '~/schemas/household-sizes'
import { TDemographicProjectionEvolution, TInadequateHousing, TRPPopulationEvolution } from '~/schemas/population-evolution'
import { TSitadel } from '~/schemas/sitadel'

export const DataVisualisationChart: FC<{
  data:
    | TRPPopulationEvolution
    | TDemographicProjectionEvolution
    | TAccommodationEvolution
    | TAccommodationLovacEvolution
    | TInadequateHousing
    | TSitadel
    | THouseholdSizesChart
  type: string | null
  source: string | null
}> = ({ data, type, source }) => {
  const isPopulationEvolution = ['population-evolution', 'menage-evolution'].includes(type ?? '')
  const isProjectionPopulationEvolution = ['projection-population-evolution'].includes(type ?? '')
  const isProjectionMenagesEvolution = ['projection-menages-evolution'].includes(type ?? '')
  const isAccommodationEvolution = ['residences-secondaires', 'logements-vacants'].includes(type ?? '')
  const isMalLogement = ['mal-logement'].includes(type ?? '')
  const isSitadel = ['sitadel'].includes(type ?? '')
  const isTailleMenages = ['taille-menages'].includes(type ?? '')

  if (isPopulationEvolution) {
    return <PopulationEvolutionChart data={data as TRPPopulationEvolution} type={type} />
  }
  if (isProjectionPopulationEvolution) {
    return <ProjectionPopulationEvolutionChart data={data as TDemographicProjectionEvolution} type={type} />
  }
  if (isProjectionMenagesEvolution) {
    return <ProjectionMenagesEvolutionChart data={data as TDemographicProjectionEvolution} type={type} />
  }
  if (isAccommodationEvolution) {
    if (source === 'rp') {
      return <RPAccommodationEvolutionChart data={data as TAccommodationEvolution} type={type} />
    }
    //todo : reenable as soon as filocom data is available
    // if (source === 'filocom') {
    // return <FilocomAccommodationEvolutionChart data={data as TAccommodationEvolution} type={type} />
    // }
    if (source === 'lovac') {
      return <LovacAccommodationEvolutionChart data={data as TAccommodationLovacEvolution} />
    }
  }
  if (isMalLogement) {
    return <BadHousingChart data={data as TInadequateHousing} />
  }
  if (isSitadel) {
    return <SitadelChart data={data as TSitadel} />
  }
  if (isTailleMenages) {
    return <HouseholdSizesChart data={data as THouseholdSizesChart} />
  }
}
