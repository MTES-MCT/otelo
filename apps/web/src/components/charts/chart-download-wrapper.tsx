'use client'

import Button from '@codegouvfr/react-dsfr/Button'
import classNames from 'classnames'
import { type ReactNode } from 'react'
import { tss } from 'tss-react'
import { useChartDownload } from '~/hooks/use-chart-download'

type ChartDownloadWrapperProps = {
  children: ReactNode
  fileName: string
  className?: string
}

export const ChartDownloadWrapper = ({ children, fileName, className }: ChartDownloadWrapperProps) => {
  const { ref, download } = useChartDownload(fileName)
  const { classes } = useStyles()

  return (
    <div ref={ref} className={classes.container}>
      <div className={classNames(classes.buttonWrapper, className)} data-chart-download-button>
        <Button iconId="ri-download-line" priority="tertiary no outline" size="small" title="Télécharger en image" onClick={download}>
          Exporter le graphique au format image
        </Button>
      </div>
      {children}
    </div>
  )
}

const useStyles = tss.create({
  container: {
    position: 'relative',
  },
  buttonWrapper: {
    position: 'absolute',
    top: 0,
    right: 0,
    zIndex: 1,
  },
})
