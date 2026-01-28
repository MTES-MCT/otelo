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
}

const COLORS = {
  shortTermVacantAccomodation: '#000091',
  longTermVacantAccomodation: '#9898F8',
  secondaryAccommodation: '#E9C53B',
  default: '#E5E5E5',
}

const ParcsComparisonCharts = ({ epci, withSecondaryAccommodation = true }: { epci: string; withSecondaryAccommodation?: boolean }) => {
  const { rates, defaultRates } = useEpcisRates()
  const ratesByEpci = rates[epci]
  const defaultRatesByEpci = defaultRates[epci]
  const [isShown, setIsShown] = useQueryState('parcEvolutionShown', parseAsBoolean.withDefault(false))

  if (!ratesByEpci || !defaultRatesByEpci) return null

  const originalSecondaryAccommodationRate = Number(defaultRatesByEpci.txRS * 100)
  const originalLongTermRate = Number(defaultRatesByEpci.longTermVacancyRate * 100)
  const shortTermRate = Number(defaultRatesByEpci.shortTermVacancyRate * 100)

  const computedLongTermRate = Number(ratesByEpci.longTermVacancyRate * 100)
  const computedSecondaryAccommodationRate = Number(ratesByEpci.txRS * 100)

  // Calculate dynamic scale with round numbers and unified scale
  // Always include secondary accommodation in scale calculation to ensure consistent scale across pages
  const calculateUnifiedScale = () => {
    const vacancy2021 = shortTermRate + originalLongTermRate + originalSecondaryAccommodationRate
    const vacancyComputed = shortTermRate + computedLongTermRate + computedSecondaryAccommodationRate

    const maxVacancy = Math.max(vacancy2021, vacancyComputed)

    // Use dynamic scale if max vacancy rates are low, otherwise use 100%
    if (maxVacancy < 30) {
      const suggestedScale = Math.ceil(maxVacancy * 1.3)
      // Round to nearest 5 or 10 for clean numbers
      if (suggestedScale <= 20) {
        return Math.ceil(suggestedScale / 5) * 5 // Round to nearest 5
      } else {
        return Math.ceil(suggestedScale / 10) * 10 // Round to nearest 10
      }
    }
    return 100
  }

  const unifiedScale = calculateUnifiedScale()

  const createScaledData = (shortTerm: number, longTerm: number, secondary: number, scale: number): SegmentData[] => {
    const vacancy = shortTerm + longTerm + (withSecondaryAccommodation ? secondary : 0)
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
      ...(withSecondaryAccommodation
        ? [
            {
              name: 'Taux de résidences secondaires',
              value: (secondary / scale) * 100,
              color: COLORS.secondaryAccommodation,
            },
          ]
        : []),
      {
        name: 'Parc total',
        value: (parcTotal / scale) * 100,
        color: COLORS.default,
      },
    ]
  }

  const data2021 = createScaledData(shortTermRate, originalLongTermRate, originalSecondaryAccommodationRate, unifiedScale)
  const computedData = createScaledData(shortTermRate, computedLongTermRate, computedSecondaryAccommodationRate, unifiedScale)

  const CustomBar = ({ data, height = 32 }: CustomBarProps) => (
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
        <span className="fr-text--xs fr-text-mention--grey">{Math.round(unifiedScale * 0.25)}%</span>
        <span className="fr-text--xs fr-text-mention--grey">{Math.round(unifiedScale * 0.5)}%</span>
        <span className="fr-text--xs fr-text-mention--grey">{Math.round(unifiedScale * 0.75)}%</span>
        <span className="fr-text--xs fr-text-mention--grey">{unifiedScale}%</span>
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
              {!!withSecondaryAccommodation && (
                <div className="fr-flex fr-align-items-center fr-flex-gap-2v">
                  <div style={{ width: '12px', height: '12px', backgroundColor: COLORS.secondaryAccommodation }} />
                  <span className="fr-text--sm fr-mb-0">Résidences secondaires</span>
                </div>
              )}
            </div>
            {/* 2021 Section */}
            <div className="fr-flex fr-direction-column fr-flex-gap-2v fr-mb-3w">
              <span className="fr-text--medium">Le parc en 2021</span>
              <CustomBar data={data2021} />
            </div>

            {/* projection section */}
            <div className="fr-flex fr-direction-column fr-flex-gap-2v">
              <span className="fr-text--medium">Le parc en 2050</span>
              <CustomBar data={computedData} />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ParcsComparisonCharts
