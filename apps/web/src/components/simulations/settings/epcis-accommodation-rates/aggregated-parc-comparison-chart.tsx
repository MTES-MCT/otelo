'use client'

import Button from '@codegouvfr/react-dsfr/Button'
import classNames from 'classnames'
import { parseAsBoolean, useQueryState } from 'nuqs'
import { useEpcisRates } from '~/app/(authenticated)/simulation/(creation)/(rates-provider)/rates-provider'
import styles from './parc-comparison-charts.module.css'

interface SegmentData {
  name: string
  value: number
  color: string
}

interface CustomBarProps {
  data: SegmentData[]
  height?: number
  scale: number
}

const COLORS = {
  shortTermVacantAccomodation: '#000091',
  longTermVacantAccomodation: '#9898F8',
  default: '#E5E5E5',
}

export const AggregatedParcsComparisonChart = () => {
  const { rates, defaultRates } = useEpcisRates()
  const [isShown, setIsShown] = useQueryState('parcEvolutionShown', parseAsBoolean.withDefault(false))

  const epciIds = Object.keys(defaultRates)
  if (epciIds.length === 0) return null

  // Calculate aggregated rates (average across all EPCIs)
  const aggregateRates = () => {
    let totalShortTerm = 0
    let totalOriginalLongTerm = 0
    let totalComputedLongTerm = 0

    epciIds.forEach((epciId) => {
      const defaultEpci = defaultRates[epciId]
      const currentEpci = rates[epciId]

      if (defaultEpci && currentEpci) {
        totalShortTerm += defaultEpci.shortTermVacancyRate
        totalOriginalLongTerm += defaultEpci.longTermVacancyRate
        totalComputedLongTerm += currentEpci.longTermVacancyRate
      }
    })

    const count = epciIds.length
    return {
      shortTermRate: (totalShortTerm / count) * 100,
      originalLongTermRate: (totalOriginalLongTerm / count) * 100,
      computedLongTermRate: (totalComputedLongTerm / count) * 100,
    }
  }

  const { shortTermRate, originalLongTermRate, computedLongTermRate } = aggregateRates()

  // Calculate dynamic scale
  const calculateUnifiedScale = () => {
    const vacancy2021 = shortTermRate + originalLongTermRate
    const vacancyComputed = shortTermRate + computedLongTermRate

    const maxVacancy = Math.max(vacancy2021, vacancyComputed)

    if (maxVacancy < 30) {
      const suggestedScale = Math.ceil(maxVacancy * 1.3)
      if (suggestedScale <= 20) {
        return Math.ceil(suggestedScale / 5) * 5
      }
      return Math.ceil(suggestedScale / 10) * 10
    }
    return 100
  }

  const unifiedScale = calculateUnifiedScale()

  const createScaledData = (shortTerm: number, longTerm: number, scale: number): SegmentData[] => {
    const vacancy = shortTerm + longTerm
    const parcTotal = scale - vacancy

    return [
      {
        name: 'Taux de logements vacants courte durée',
        value: (shortTerm / scale) * 100,
        color: COLORS.shortTermVacantAccomodation,
      },
      {
        name: 'Taux de logements vacants longue durée',
        value: (longTerm / scale) * 100,
        color: COLORS.longTermVacantAccomodation,
      },
      {
        name: 'Parc total',
        value: (parcTotal / scale) * 100,
        color: COLORS.default,
      },
    ]
  }

  const data2021 = createScaledData(shortTermRate, originalLongTermRate, unifiedScale)
  const computedData = createScaledData(shortTermRate, computedLongTermRate, unifiedScale)

  const CustomBar = ({ data, height = 32, scale }: CustomBarProps) => (
    <div className="fr-flex fr-direction-column">
      <div className="fr-position-relative fr-width-full" style={{ height: `${height}px` }}>
        <div className="fr-position-absolute fr-flex fr-height-full fr-width-full">
          {data.map((segment, index) => (
            <div
              key={index}
              style={{
                width: `${segment.value}%`,
                backgroundColor: segment.color,
                height: '100%',
              }}
            />
          ))}
        </div>
      </div>
      <div className="fr-position-relative fr-width-full" style={{ height: '8px' }}>
        <div className="fr-position-absolute fr-width-full fr-height-full fr-flex fr-justify-content-space-between">
          <div style={{ width: '1px', height: '100%', backgroundColor: '#666' }} />
          <div style={{ width: '1px', height: '100%', backgroundColor: '#666' }} />
          <div style={{ width: '1px', height: '100%', backgroundColor: '#666' }} />
          <div style={{ width: '1px', height: '100%', backgroundColor: '#666' }} />
          <div style={{ width: '1px', height: '100%', backgroundColor: '#666' }} />
        </div>
      </div>
      <div className="fr-flex fr-justify-content-space-between">
        <span className="fr-text--xs fr-text-mention--grey">0%</span>
        <span className="fr-text--xs fr-text-mention--grey">{Math.round(scale * 0.25)}%</span>
        <span className="fr-text--xs fr-text-mention--grey">{Math.round(scale * 0.5)}%</span>
        <span className="fr-text--xs fr-text-mention--grey">{Math.round(scale * 0.75)}%</span>
        <span className="fr-text--xs fr-text-mention--grey">{scale}%</span>
      </div>
    </div>
  )

  return (
    <div className="fr-border-top fr-p-3v fr-flex fr-direction-column fr-justify-content-space-between">
      <Button
        onClick={() => setIsShown(!isShown)}
        priority="tertiary no outline"
        className="fr-width-full fr-flex fr-justify-content-space-between"
      >
        <span className="fr-text-title--blue-france fr-text--medium">Simuler graphiquement l'évolution du parc</span>
        <span
          className={classNames(
            'fr-text-title--blue-france fr-text--medium',
            isShown ? 'ri-arrow-drop-up-line' : 'ri-arrow-drop-down-line',
          )}
        />
      </Button>
      {isShown && (
        <div className={classNames(styles.chartContainer, 'fr-p-3w', 'fr-mt-3v')}>
          <div className="fr-flex fr-direction-column">
            <div className="fr-flex fr-flex-gap-2v fr-justify-content-end">
              <div className="fr-flex fr-align-items-center fr-flex-gap-2v">
                <div style={{ width: '12px', height: '12px', backgroundColor: COLORS.shortTermVacantAccomodation }} />
                <span className="fr-text--sm fr-mb-0">Vacance courte durée</span>
              </div>
              <div className="fr-flex fr-align-items-center fr-flex-gap-2v">
                <div style={{ width: '12px', height: '12px', backgroundColor: COLORS.longTermVacantAccomodation }} />
                <span className="fr-text--sm fr-mb-0">Vacance longue durée</span>
              </div>
            </div>
            {/* 2021 Section */}
            <div className="fr-flex fr-direction-column fr-flex-gap-2v fr-mb-3w">
              <span className="fr-text--medium">Le parc en 2021 (moyenne du territoire)</span>
              <CustomBar data={data2021} scale={unifiedScale} />
            </div>

            {/* projection section */}
            <div className="fr-flex fr-direction-column fr-flex-gap-2v">
              <span className="fr-text--medium">Le parc en 2050 (moyenne du territoire)</span>
              <CustomBar data={computedData} scale={unifiedScale} />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
