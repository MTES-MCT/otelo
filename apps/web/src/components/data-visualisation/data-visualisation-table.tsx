import { FC } from 'react'
import { AccommodationEvolutionTable } from '~/components/table/accommodation-evolution-table'
import { LovacAccommodationEvolutionTable } from '~/components/table/lovac-accommodation-evolution-table'
import { PopulationEvolutionTable } from '~/components/table/population-evolution-table'
import { ProjectionMenagesEvolutionTable } from '~/components/table/projection-menages-evolution-table'
import { ProjectionPopulationEvolutionTable } from '~/components/table/projection-population-evolution-table'

import {
  TAccommodationEvolution,
  TAccommodationEvolutionDataTable,
  TAccommodationLovacEvolution,
  TAccommodationLovacEvolutionDataTable,
} from '~/schemas/accommodation-evolution'
import {
  TDemographicMenagesEvolution,
  TDemographicProjectionDataTable,
  TDemographicProjectionEvolution,
  TRPPopulationEvolution,
} from '~/schemas/population-evolution'

export const DataVisualisationTable: FC<{
  data:
    | TRPPopulationEvolution
    | TDemographicProjectionEvolution
    | TDemographicMenagesEvolution
    | TAccommodationEvolution
    | TAccommodationLovacEvolution
  type: string | null
  source: string | null
}> = ({ data, type, source }) => {
  const isPopulationOrMenageEvolution = ['population-evolution', 'menage-evolution'].includes(type ?? '')
  const isProjectionPopulationEvolution = ['projection-population-evolution'].includes(type ?? '')
  const isProjectionMenagesEvolution = ['projection-menages-evolution'].includes(type ?? '')
  const isResidencesSecondaires = ['residences-secondaires'].includes(type ?? '')
  const isLogementsVacants = ['logements-vacants'].includes(type ?? '')

  if (isPopulationOrMenageEvolution) {
    return <PopulationEvolutionTable data={data as TRPPopulationEvolution} type={type} />
  }

  if (isProjectionPopulationEvolution) {
    return (
      <ProjectionPopulationEvolutionTable
        maxYears={(data as TDemographicProjectionEvolution).maxYears}
        data={data.tableData as TDemographicProjectionDataTable}
      />
    )
  }

  if (isProjectionMenagesEvolution) {
    return (
      <ProjectionMenagesEvolutionTable
        maxYears={(data as TDemographicMenagesEvolution).maxYears}
        data={data.tableData as TDemographicProjectionDataTable}
      />
    )
  }

  if (isResidencesSecondaires) {
    return <AccommodationEvolutionTable type="secondaryAccommodation" data={data.tableData as TAccommodationEvolutionDataTable} />
  }

  if (isLogementsVacants) {
    if (source === 'lovac') {
      return <LovacAccommodationEvolutionTable data={data.tableData as TAccommodationLovacEvolutionDataTable} />
    }
    return <AccommodationEvolutionTable type="vacant" data={data.tableData as TAccommodationEvolutionDataTable} />
  }
}
