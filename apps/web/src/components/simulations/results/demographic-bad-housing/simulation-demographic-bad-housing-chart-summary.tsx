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
  const demographyPercent = (demographyValue / totalFlux) * 100
  const badHousingPercent = (badHousingValue / totalFlux) * 100
  return (
    <div className={styles.barContainer}>
      <div className={styles.barWrapper}>
        <div className={styles.barDemography} style={{ width: `${demographyPercent}%` }} />
        <div className={styles.barBadHousing} style={{ width: `${badHousingPercent}%` }} />
      </div>
    </div>
  )
}
