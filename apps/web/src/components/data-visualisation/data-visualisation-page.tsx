'use client'
import classNames from 'classnames'
import { parseAsString, useQueryStates } from 'nuqs'
import { FC } from 'react'
import { tss } from 'tss-react'
import { DataVisualisationChart } from '~/components/data-visualisation/data-visualisation-chart'
import { DataVisualisationTable } from '~/components/data-visualisation/data-visualisation-table'
import { SelectMillesime } from '~/components/data-visualisation/select-millesime'
import { useDataVisualisation } from '~/hooks/use-data-visualisation'

const MILLESIME_TYPES = ['population-evolution', 'menage-evolution', 'logements-vacants', 'residences-secondaires']

export const DataVisualisationPage: FC = () => {
  const { classes } = useStyles()
  const [queryStates] = useQueryStates({
    type: parseAsString,
    source: parseAsString.withDefault('rp'),
    millesime: parseAsString,
  })
  const { data, isLoading } = useDataVisualisation()

  if (isLoading) return <div>Chargement des données en cours...</div>
  const { type, source, millesime } = queryStates
  const isProjection = MILLESIME_TYPES.includes(type ?? '')
  return (
    <div className={classNames('fr-my-4v', classes.container)}>
      {isProjection && (
        <div className={classes.millesimeRow}>
          <SelectMillesime />
        </div>
      )}
      {!!data && (
        <>
          <DataVisualisationChart data={data} type={type} source={source} />
          <DataVisualisationTable type={type} data={data} source={source} millesime={millesime} />
        </>
      )}
    </div>
  )
}

const useStyles = tss.create({
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2rem',
  },
  millesimeRow: {
    display: 'flex',
    justifyContent: 'flex-end',
  },
})
