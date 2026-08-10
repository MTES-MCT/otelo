'use client'

import Button from '@codegouvfr/react-dsfr/Button'
import classNames from 'classnames'
import { createContext, type ReactNode, useContext } from 'react'
import { tss } from 'tss-react'
import { useChartDownload } from '~/hooks/use-chart-download'

type ChartDownloadWrapperProps = {
  children: ReactNode
  fileName: string
  className?: string
  /**
   * Par défaut le bouton flotte en haut à droite du graphique. Le passer à `false` permet de le
   * placer soi-même dans le flux, via `<ChartDownloadButton />`, quand cette position recouvre
   * le contenu ou s'éloigne trop du graphique.
   */
  withFloatingButton?: boolean
}

const ChartDownloadContext = createContext<(() => void) | null>(null)

const DownloadButton = ({ onClick, className }: { onClick: () => void; className?: string }) => (
  // data-chart-download-button : exclut le bouton de la capture (cf. use-chart-download).
  <div className={className} data-chart-download-button>
    <Button iconId="ri-download-line" priority="tertiary no outline" size="small" title="Télécharger en image" onClick={onClick}>
      Exporter le graphique au format image
    </Button>
  </div>
)

/** À placer n'importe où dans un `ChartDownloadWrapper` monté avec `withFloatingButton={false}`. */
export const ChartDownloadButton = ({ className }: { className?: string }) => {
  const download = useContext(ChartDownloadContext)
  const { classes } = useStyles()

  if (!download) return null

  return <DownloadButton onClick={download} className={classNames(classes.inlineButtonWrapper, className)} />
}

export const ChartDownloadWrapper = ({ children, fileName, className, withFloatingButton = true }: ChartDownloadWrapperProps) => {
  const { ref, download } = useChartDownload(fileName)
  const { classes } = useStyles()

  return (
    <ChartDownloadContext.Provider value={download}>
      <div ref={ref} className={classes.container}>
        {withFloatingButton && <DownloadButton onClick={download} className={classNames(classes.buttonWrapper, className)} />}
        {children}
      </div>
    </ChartDownloadContext.Provider>
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
  inlineButtonWrapper: {
    display: 'flex',
    justifyContent: 'flex-end',
  },
})
