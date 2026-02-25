import classNames from 'classnames'
import { FC, ReactNode } from 'react'
import { tss } from 'tss-react'
import { ChartDownloadWrapper } from '~/components/charts/chart-download-wrapper'
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
  const { classes } = useStyles()

  const chartTypeClassNames: Record<string, string> = {
    'projection-population-evolution': classes.buttonOffset,
    'projection-menages-evolution': classes.buttonOffset,
    'taille-menages': classes.buttonOffset,
    'residences-secondaires': classes.buttonOffset,
    'logements-vacants': classes.buttonOffset,
    'mal-logement': classNames(classes.buttonOffset, classes.buttonLeft),
    sitadel: classes.buttonOffset,
  }

  const isProjectionPopulationEvolution = ['projection-population-evolution'].includes(type ?? '')
  const isProjectionMenagesEvolution = ['projection-menages-evolution'].includes(type ?? '')
  const isPopulationEvolution = ['population-evolution', 'menage-evolution'].includes(type ?? '')
  const isAccommodationEvolution = ['residences-secondaires', 'logements-vacants'].includes(type ?? '')
  const isMalLogement = ['mal-logement'].includes(type ?? '')
  const isSitadel = ['sitadel'].includes(type ?? '')
  const isTailleMenages = ['taille-menages'].includes(type ?? '')
  let chartContent: ReactNode = null

  if (isPopulationEvolution) {
    chartContent = <PopulationEvolutionChart data={data as TRPPopulationEvolution} type={type} />
  } else if (isProjectionPopulationEvolution) {
    chartContent = <ProjectionPopulationEvolutionChart data={data as TDemographicProjectionEvolution} type={type} />
  } else if (isProjectionMenagesEvolution) {
    chartContent = <ProjectionMenagesEvolutionChart data={data as TDemographicProjectionEvolution} type={type} />
  } else if (isAccommodationEvolution) {
    if (source === 'rp') {
      chartContent = <RPAccommodationEvolutionChart data={data as TAccommodationEvolution} type={type} />
    }
    if (source === 'lovac') {
      chartContent = <LovacAccommodationEvolutionChart data={data as TAccommodationLovacEvolution} />
    }
  } else if (isMalLogement) {
    chartContent = <BadHousingChart data={data as TInadequateHousing} />
  } else if (isSitadel) {
    chartContent = <SitadelChart data={data as TSitadel} />
  } else if (isTailleMenages) {
    chartContent = <HouseholdSizesChart data={data as THouseholdSizesChart} />
  }

  if (!chartContent) return null

  return (
    <ChartDownloadWrapper fileName={type ?? 'graphique'} className={chartTypeClassNames[type ?? '']}>
      {chartContent}
    </ChartDownloadWrapper>
  )
}

const useStyles = tss.create({
  buttonOffset: {
    top: '3.5rem !important',
  },
  buttonLeft: {
    left: '9px !important',
    right: 'unset !important',
  },
})
