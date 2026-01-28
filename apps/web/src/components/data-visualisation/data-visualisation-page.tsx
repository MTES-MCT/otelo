'use client'
import classNames from 'classnames'
import { parseAsString, useQueryStates } from 'nuqs'
import { FC } from 'react'
import { tss } from 'tss-react'
import { DataVisualisationChart } from '~/components/data-visualisation/data-visualisation-chart'
import { DataVisualisationTable } from '~/components/data-visualisation/data-visualisation-table'
import { useDataVisualisation } from '~/hooks/use-data-visualisation'

export const DataVisualisationPage: FC = () => {
  const { classes } = useStyles()
  const [queryStates] = useQueryStates({
    type: parseAsString,
    source: parseAsString.withDefault('rp'),
  })
  const { data, isLoading } = useDataVisualisation()

  if (isLoading) return <div>Chargement des données en cours...</div>
  const { type, source } = queryStates
  return (
    <div className={classNames('fr-my-4v', classes.container)}>
      {!!data && (
        <>
          <DataVisualisationChart data={data} type={type} source={source} />
          <DataVisualisationTable type={type} data={data} source={source} />
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
})
