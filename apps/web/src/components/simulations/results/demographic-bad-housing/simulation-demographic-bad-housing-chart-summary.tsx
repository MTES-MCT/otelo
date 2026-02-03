import classNames from 'classnames'
import styles from './simulation-demographic-bad-housing-chart-summary.module.css'

export const SimulationDemographicBadHousingChartSummary = ({
  totalFlux,
  totalStock,
  epci,
}: {
  totalFlux: number
  totalStock: number
  epci?: {
    name: string
    peakYear: number
    prepeakTotalStock: number
    postpeakTotalStock: number
  }
}) => {
  const { prepeakTotalStock } = epci ?? {}
  const badHousingValue = epci && prepeakTotalStock ? prepeakTotalStock : totalStock
  const demographyValue = totalFlux - badHousingValue

  // Use only positive values for chart proportions
  const demographyForChart = Math.max(0, demographyValue)
  const badHousingForChart = Math.max(0, badHousingValue)
  const totalForChart = demographyForChart + badHousingForChart

  const demographyPercent = totalForChart > 0 ? (demographyForChart / totalForChart) * 100 : 0
  const badHousingPercent = totalForChart > 0 ? (badHousingForChart / totalForChart) * 100 : 0
  const hasBothBars = demographyPercent > 0 && badHousingPercent > 0

  return (
    <div className={styles.barContainer}>
      <div className={styles.barWrapper}>
        <div className={classNames(styles.barDemography, { 'fr-mr-2v': hasBothBars })} style={{ width: `${demographyPercent}%` }} />
        <div className={classNames(styles.barBadHousing, { 'fr-ml-2v': hasBothBars })} style={{ width: `${badHousingPercent}%` }} />
      </div>
    </div>
  )
}
