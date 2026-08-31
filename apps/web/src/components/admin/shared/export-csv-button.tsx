'use client'

import Button from '@codegouvfr/react-dsfr/Button'
import type { FC } from 'react'
import { useCsvExport } from '~/hooks/use-csv-export'
import { usePeriodRange } from './period-selector'

type ExportCsvButtonProps = {
  /** Clé du jeu de données, cf. le catalogue côté API (`statistics/exports/:dataset`). */
  dataset: string
  label?: string
  priority?: 'primary' | 'secondary' | 'tertiary'
  /** Faux pour les exports portant sur l'historique complet, qui n'acceptent pas de période. */
  withPeriod?: boolean
}

/**
 * Bouton d'export CSV.
 *
 * La période est lue depuis l'URL, la même source que les graphiques affichés : ce qui
 * est téléchargé correspond toujours à ce qui est à l'écran.
 */
export const ExportCsvButton: FC<ExportCsvButtonProps> = ({
  dataset,
  label = 'Exporter (CSV)',
  priority = 'secondary',
  withPeriod = true,
}) => {
  const { range } = usePeriodRange()
  const { exportCsv, isPending } = useCsvExport(`/api/statistics/exports/${dataset}`, `${dataset}.csv`)

  return (
    <Button
      disabled={isPending}
      iconId="fr-icon-download-line"
      onClick={() => exportCsv(withPeriod ? range : {})}
      priority={priority}
      size="small"
    >
      {isPending ? 'Export en cours…' : label}
    </Button>
  )
}
