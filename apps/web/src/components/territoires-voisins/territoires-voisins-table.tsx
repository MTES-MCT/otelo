'use client'

import { TEpciNeighborWithGeo } from '@shared'
import styles from './territoires-voisins.module.css'

interface TerritoiresVoisinsTableProps {
  neighbors: TEpciNeighborWithGeo[]
  category: string
  // onRowClick?: (neighbor: TEpciNeighborWithGeo) => void
}

const RANK_COLORS = ['#18753C', '#27A658', '#3CD474', '#68E196', '#95EDC0', '#B8F0D1', '#C9F5DE', '#D8F8E8', '#E6FAF0', '#F2FDF8']

const toSimilarity = (score: number) => (1 - score) * 100

export const TerritoiresVoisinsTable = ({ neighbors }: TerritoiresVoisinsTableProps) => {
  const maxSimilarity = Math.max(...neighbors.map((n) => toSimilarity(n.score)))

  return (
    <div className="fr-table fr-table--bordered">
      <table className={styles.neighborsTable}>
        <thead>
          <tr>
            <th style={{ width: '50px' }}>Rang</th>
            <th>EPCI</th>
            <th style={{ width: '120px' }}>Code EPCI</th>
            <th style={{ width: '250px' }}>Similarité</th>
          </tr>
        </thead>
        <tbody>
          {neighbors.map((neighbor) => (
            <tr
              key={neighbor.neighborEpciCode}
              className={styles.clickableRow}
              // onClick={() => onRowClick?.(neighbor)}
            >
              <td>
                <span className={styles.rankBadge} style={{ background: RANK_COLORS[neighbor.rank - 1] || '#95EDC0' }}>
                  {neighbor.rank}
                </span>
              </td>
              <td>{neighbor.geo?.nom ?? neighbor.neighborEpci.name}</td>
              <td>{neighbor.neighborEpciCode}</td>
              <td>
                <div className={styles.scoreBar}>
                  <div className={styles.scoreBarTrack}>
                    <div
                      className={styles.scoreBarFill}
                      style={{
                        width: `${(toSimilarity(neighbor.score) / maxSimilarity) * 100}%`,
                        background: `color-mix(in srgb, #18753C ${Math.max(20, 100 - (neighbor.rank / 10) * 80)}%, #95EDC0)`,
                      }}
                    />
                  </div>
                  <span className={styles.scoreValue}>{toSimilarity(neighbor.score).toFixed(1)} %</span>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
