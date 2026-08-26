import { FC } from 'react'
import { AccommodationEvolutionTable } from '~/components/table/accommodation-evolution-table'
import { AgePyramidTable } from '~/components/table/age-pyramid-table'
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
import { TAgePyramid } from '~/schemas/age-pyramid'
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
    | TAgePyramid
  type: string | null
  source: string | null
  millesime?: string | null
}> = ({ data, type, source, millesime }) => {
  const isPopulationOrMenageEvolution = ['population-evolution', 'menage-evolution'].includes(type ?? '')
  const isProjectionPopulationEvolution = ['projection-population-evolution'].includes(type ?? '')
  const isProjectionMenagesEvolution = ['projection-menages-evolution'].includes(type ?? '')
  const isResidencesSecondaires = ['residences-secondaires'].includes(type ?? '')
  const isLogementsVacants = ['logements-vacants'].includes(type ?? '')
  const isPyramideDesAges = ['pyramide-des-ages'].includes(type ?? '')

  if (isPyramideDesAges) {
    return <AgePyramidTable data={data as TAgePyramid} />
  }

  // Passé la pyramide, tous les autres jeux portent un `tableData` — que l'union ne peut plus
  // garantir depuis qu'elle inclut la pyramide, dont la forme est différente.
  const { tableData } = data as { tableData: unknown }

  if (isPopulationOrMenageEvolution) {
    return <PopulationEvolutionTable data={data as TRPPopulationEvolution} type={type} />
  }

  if (isProjectionPopulationEvolution) {
    return (
      <ProjectionPopulationEvolutionTable
        maxYears={(data as TDemographicProjectionEvolution).maxYears}
        data={tableData as TDemographicProjectionDataTable}
        millesime={millesime}
      />
    )
  }

  if (isProjectionMenagesEvolution) {
    return (
      <ProjectionMenagesEvolutionTable
        maxYears={(data as TDemographicMenagesEvolution).maxYears}
        data={tableData as TDemographicProjectionDataTable}
        millesime={millesime}
      />
    )
  }

  if (isResidencesSecondaires) {
    return <AccommodationEvolutionTable type="secondaryAccommodation" data={tableData as TAccommodationEvolutionDataTable} />
  }

  if (isLogementsVacants) {
    if (source === 'lovac') {
      return <LovacAccommodationEvolutionTable data={tableData as TAccommodationLovacEvolutionDataTable} />
    }
    return <AccommodationEvolutionTable type="vacant" data={tableData as TAccommodationEvolutionDataTable} />
  }
}
