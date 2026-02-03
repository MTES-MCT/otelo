'use client'

import { TEpciNeighborWithGeo } from '@shared'
import { useEffect } from 'react'
import styles from './territoires-voisins.module.css'

interface TerritoiresVoisinsModalProps {
  epci: TEpciNeighborWithGeo
  category: string
  categoryLabel: string
  isReference: boolean
  onClose: () => void
}

const CATEGORY_VARIABLES: Record<string, string[]> = {
  gen: ['Population', 'Taux annuel de construction', "Taux d'actifs", 'Taux de propriétaires'],
  logvac: ['Taux de logements vacants', 'Vacance courte durée', 'Vacance longue durée', 'Évolution du taux de vacance'],
  mlgmt: ['Suroccupation', 'Précarité énergétique', 'Inconfort sanitaire', 'Effort financier excessif'],
  projdem: ['Évolution population projetée', 'Évolution ménages projetée', 'Solde migratoire', 'Indice de vieillissement'],
  ressec: ['Taux de résidences secondaires', 'Évolution résidences secondaires', 'Part du littoral', 'Part montagne'],
}

export const TerritoiresVoisinsModal = ({ epci, category, categoryLabel, isReference, onClose }: TerritoiresVoisinsModalProps) => {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }

    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = ''
    }
  }, [])

  const variables = CATEGORY_VARIABLES[category] || CATEGORY_VARIABLES.gen
  const nom = epci.geo?.nom ?? epci.neighborEpci.name

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <div>
            <h2 className={styles.modalTitle}>{nom}</h2>
            <p className={styles.modalSubtitle}>
              SIREN : {epci.neighborEpciCode}
              {isReference ? ' — Territoire de référence' : ` — Voisin n°${epci.rank}`}
            </p>
          </div>
          <button type="button" className={styles.modalClose} onClick={onClose} aria-label="Fermer">
            <span className="fr-icon-close-line" />
          </button>
        </div>

        <div className={styles.modalBody}>
          {/* Main stats */}
          <div className={styles.statsGrid}>
            {!isReference && (
              <div className={styles.statCard}>
                <div className={styles.statLabel}>Score de proximité</div>
                <div className={styles.statValue}>{epci.score.toFixed(4)}</div>
              </div>
            )}
            {!isReference && (
              <div className={styles.statCard}>
                <div className={styles.statLabel}>Rang</div>
                <div className={styles.statValue}>
                  {epci.rank}
                  <span className={styles.statUnit}> / 10</span>
                </div>
              </div>
            )}
            <div className={styles.statCard}>
              <div className={styles.statLabel}>Catégorie</div>
              <div className={styles.statValue} style={{ fontSize: '1rem' }}>
                {categoryLabel}
              </div>
            </div>
          </div>

          {/* Category-specific variables */}
          <div className={styles.sectionTitle}>Variables de la catégorie « {categoryLabel} »</div>
          <div className={styles.statsGrid}>
            {variables.map((variable) => (
              <div key={variable} className={styles.statCard}>
                <div className={styles.statLabel}>{variable}</div>
                <div className={styles.statValue} style={{ fontSize: '1rem', color: 'var(--text-mention-grey)' }}>
                  —
                </div>
              </div>
            ))}
          </div>
          <p style={{ fontSize: '0.8125rem', color: 'var(--text-mention-grey)', fontStyle: 'italic', marginTop: '0.5rem' }}>
            Les données statistiques détaillées seront disponibles lors de la connexion aux données du territoire.
          </p>
        </div>
      </div>
    </div>
  )
}
