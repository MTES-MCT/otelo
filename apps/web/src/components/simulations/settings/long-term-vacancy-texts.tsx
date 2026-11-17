import { FC } from 'react'
import { LONG_TERM_VACANCY_DEFINITION } from '~/components/simulations/tutorial/definitions'
import { DefinitionTooltip } from '~/components/ui/definition-tooltip'
import { ReadingKey } from '~/components/ui/reading-key'

const formatRate = (rate: number) => `${(rate * 100).toFixed(2).replace('.', ',')} %`

type LongTermVacancyQuestionProps = {
  millesime: string | number | null
  /** « CA Golfe du Morbihan », ou « l'ensemble du territoire » quand le taux s'applique à tous les EPCI. */
  territoryLabel: string
  observedRate: number
  targetYear: number | null
}

/**
 * Question posée au-dessus du curseur de vacance longue durée.
 *
 * Elle nomme le territoire : quand le taux se règle EPCI par EPCI, l'utilisateur doit toujours savoir
 * lequel il est en train de paramétrer.
 */
export const LongTermVacancyQuestion: FC<LongTermVacancyQuestionProps> = ({ millesime, territoryLabel, observedRate, targetYear }) => (
  <p className="fr-mb-0">
    Le taux de <strong>vacance longue durée</strong> <DefinitionTooltip definition={LONG_TERM_VACANCY_DEFINITION} /> observé en {millesime}{' '}
    pour {territoryLabel} s&apos;élève à <strong>{formatRate(observedRate)}</strong>. De combien souhaitez-vous réduire ce taux d&apos;ici{' '}
    {targetYear} ?
  </p>
)

export const LongTermVacancyReadingKey: FC<{ territoryLabel: string; projectedRate: number; targetYear: number | null }> = ({
  territoryLabel,
  projectedRate,
  targetYear,
}) => (
  <ReadingKey className="fr-mt-3w">
    Pour <strong>{territoryLabel}</strong>, le taux de vacance longue durée sera de <strong>{formatRate(projectedRate)}</strong> en{' '}
    {targetYear}.
  </ReadingKey>
)
