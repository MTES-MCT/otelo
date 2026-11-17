import { FC } from 'react'
import { ReadingKey } from '~/components/ui/reading-key'

const formatRate = (rate: number) => `${(rate * 100).toFixed(2).replace('.', ',')} %`

/** Constat posé au-dessus du champ de taux cible : il nomme le territoire paramétré. */
export const SecondaryResidenceObservation: FC<{ year?: number | string; territoryLabel: string; observedRate: number }> = ({
  year,
  territoryLabel,
  observedRate,
}) => (
  <p className="fr-mb-0">
    Le taux de <strong>résidences secondaires</strong> observé en {year} pour {territoryLabel} s&apos;élève à{' '}
    <strong>{formatRate(observedRate)}</strong>.
  </p>
)

export const SecondaryResidenceReadingKey: FC<{
  territoryLabel: string
  observedRate: number
  targetRate: number
  targetYear: number | null
}> = ({ territoryLabel, observedRate, targetRate, targetYear }) => (
  <ReadingKey>
    Pour <strong>{territoryLabel}</strong>, la part de résidences secondaires passera de <strong>{formatRate(observedRate)}</strong> à{' '}
    <strong>{formatRate(targetRate)}</strong> d&apos;ici {targetYear}.
  </ReadingKey>
)
