'use client'

import { fr } from '@codegouvfr/react-dsfr'
import Button from '@codegouvfr/react-dsfr/Button'
import { Select } from '@codegouvfr/react-dsfr/Select'
import { Table } from '@codegouvfr/react-dsfr/Table'
import { USER_TYPE_LABELS } from '@shared'
import classNames from 'classnames'
import dayjs from 'dayjs'
import { useMemo, useState } from 'react'
import { useExportPilotageStatistics } from '~/hooks/use-export-pilotage-statistics'
import { usePilotageEpcisCoverage } from '~/hooks/use-pilotage-epcis-coverage'
import { usePilotageStatistics } from '~/hooks/use-pilotage-statistics'
import { useSession } from '~/lib/auth/client'
import type { MapColorMode } from './pilotage-deployment-map'
import { PilotageDeploymentMapWrapper } from './pilotage-deployment-map-wrapper'
import { PilotageScenariosTable } from './pilotage-scenarios-table'
import styles from './pilotage-tab.module.css'

const ADMIN_MAP_VIEWS = [
  { value: '', label: 'EPCI (défaut)' },
  { value: 'AgenceUrbanisme', label: "Agences d'urbanisme" },
  { value: 'SCOTPETR', label: 'SCoT' },
] as const

const MAP_COLOR_MODES: { value: MapColorMode; label: string }[] = [
  { value: 'scenarios', label: 'Scénarios' },
  { value: 'score', label: "Score d'usage" },
  { value: 'exports', label: 'Exports' },
]

export default function PilotageTab() {
  const [selectedRegion, setSelectedRegion] = useState<string | undefined>(undefined)
  const [selectedTypology, setSelectedTypology] = useState<string | undefined>(undefined)
  const [adminMapView, setAdminMapView] = useState<string>('')
  const [mapColorMode, setMapColorMode] = useState<MapColorMode>('scenarios')

  const { data: session } = useSession()

  const isAdmin = session?.user.role === 'ADMIN'
  const isDreal = session?.user.type === 'DREAL'
  const userRegion = session?.user.region ?? undefined
  const effectiveRegion = isDreal ? userRegion : selectedRegion

  const { data, isLoading, error } = usePilotageStatistics(effectiveRegion, undefined)
  const { isPending: isExporting, mutateAsync: exportCsv } = useExportPilotageStatistics()
  const { data: coverageData = [] } = usePilotageEpcisCoverage(effectiveRegion, undefined, selectedTypology)

  const effectiveMapType = isAdmin ? adminMapView || undefined : session?.user.type
  const regions = data?.regions ?? []

  const regionRanking = useMemo(() => {
    if (!data) return []
    const byRegion = new Map<string, number>()
    for (const row of data.actorsByRegion) {
      byRegion.set(row.region, (byRegion.get(row.region) ?? 0) + row.nbScenarios)
    }
    const sorted = [...byRegion.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5)
    const max = sorted[0]?.[1] ?? 1
    return sorted.map(([region, count]) => ({
      region,
      count,
      score: Math.round((count / max) * 100),
    }))
  }, [data])

  const typologyUsage = useMemo(() => {
    if (!data) return []
    const byType = new Map<string, number>()
    for (const row of data.actorsByRegion) {
      if (!row.actorType) continue
      byType.set(row.actorType, (byType.get(row.actorType) ?? 0) + row.nbScenarios)
    }
    const sorted = [...byType.entries()].sort((a, b) => b[1] - a[1])
    const max = sorted[0]?.[1] ?? 1
    return sorted.map(([type, count]) => ({
      type,
      label: USER_TYPE_LABELS[type as keyof typeof USER_TYPE_LABELS] ?? type,
      count,
      pct: Math.round((count / max) * 100),
    }))
  }, [data])

  const legendItems =
    mapColorMode === 'scenarios'
      ? [
          { swatchClass: styles.legendSwatchCovered, label: 'Avec scénario' },
          { swatchClass: styles.legendSwatchUncovered, label: 'Sans scénario' },
        ]
      : [
          { swatchClass: styles.legendSwatchCovered, label: 'Usage fort' },
          { swatchClass: styles.legendSwatchMedium, label: 'Usage modéré' },
          { swatchClass: styles.legendSwatchLow, label: 'Usage faible' },
          { swatchClass: styles.legendSwatchUncovered, label: 'Sans scénario' },
        ]

  if (isLoading) return <p>Chargement des données de pilotage...</p>

  if (error) {
    return (
      <div className={fr.cx('fr-alert', 'fr-alert--error')}>
        <p>Erreur lors du chargement des données de pilotage</p>
      </div>
    )
  }

  if (!data) return null

  return (
    <div>
      <h1 className="fr-mb-1v">Pilotage du déploiement</h1>
      <p className={`${fr.cx('fr-text--sm')} fr-text-mention--grey fr-mb-4v`}>Suivi de l'usage et de la couverture territoriale d'Otelo.</p>

      {/* Filters — selects + export on one row */}
      <div className={styles.filtersBar}>
        {isAdmin && (
          <div>
            <Select
              label="Région"
              nativeSelectProps={{
                value: selectedRegion ?? '',
                onChange: (e) => setSelectedRegion(e.target.value || undefined),
              }}
            >
              <option value="">Toutes les régions</option>
              {regions.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </Select>
          </div>
        )}
        {isDreal && userRegion && (
          <div>
            <p className={fr.cx('fr-text--sm', 'fr-mb-0')}>
              <strong>Région :</strong> {userRegion}
            </p>
          </div>
        )}
        <div>
          <Select
            label="Typologie d'acteur"
            nativeSelectProps={{
              value: selectedTypology ?? '',
              onChange: (e) => setSelectedTypology(e.target.value || undefined),
            }}
          >
            <option value="">Toutes les typologies</option>
            {Object.entries(USER_TYPE_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </Select>
        </div>
        {isAdmin && (
          <div>
            <Select
              label="Vue cartographique"
              nativeSelectProps={{
                value: adminMapView,
                onChange: (e) => setAdminMapView(e.target.value),
              }}
            >
              {ADMIN_MAP_VIEWS.map(({ value, label }) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </Select>
          </div>
        )}
        <Button
          iconId="ri-download-line"
          priority="secondary"
          disabled={isExporting}
          onClick={() => exportCsv({ region: effectiveRegion, department: undefined })}
        >
          {isExporting ? 'Export en cours...' : 'Exporter en CSV'}
        </Button>
      </div>

      {/* KPI tiles — 4 tiles */}
      <div className={styles.kpiGrid}>
        <div className={styles.kpiTile}>
          <div className="fr-flex fr-justify-content-space-between fr-align-items-center">
            <span className={styles.kpiTileLabel}>Régions actives</span>
            <i className={`ri-map-2-line ${styles.kpiTileIcon}`} aria-hidden="true" />
          </div>
          <div className={styles.kpiTileNum}>{data.kpis.totalActiveRegions}</div>
          <div className={styles.kpiTileSub}>Régions avec au moins un scénario</div>
        </div>

        <div className={styles.kpiTile}>
          <div className="fr-flex fr-justify-content-space-between fr-align-items-center">
            <span className={styles.kpiTileLabel}>Acteurs actifs</span>
            <i className={`ri-team-line ${styles.kpiTileIcon}`} aria-hidden="true" />
          </div>
          <div className={styles.kpiTileNum}>{data.kpis.totalActiveActors}</div>
          <div className={styles.kpiTileSub}>Utilisateurs ayant créé un scénario</div>
        </div>

        <div className={styles.kpiTile}>
          <div className="fr-flex fr-justify-content-space-between fr-align-items-center">
            <span className={styles.kpiTileLabel}>Scénarios réalisés</span>
            <i className={`ri-file-chart-line ${styles.kpiTileIcon}`} aria-hidden="true" />
          </div>
          <div className={styles.kpiTileNum}>{data.kpis.totalScenarios.toLocaleString('fr-FR')}</div>
          <div className={styles.kpiTileSub}>Total des scénarios</div>
        </div>

        <div className={styles.kpiTile}>
          <div className="fr-flex fr-justify-content-space-between fr-align-items-center">
            <span className={styles.kpiTileLabel}>Exports</span>
            <i className={`ri-download-cloud-line ${styles.kpiTileIcon}`} aria-hidden="true" />
          </div>
          <div className={styles.kpiTileNum}>{data.kpis.totalExports.toLocaleString('fr-FR')}</div>
          <div className={styles.kpiTileSub}>
            {data.kpis.totalScenarios > 0
              ? `${Math.round((data.kpis.totalExports / data.kpis.totalScenarios) * 100)}% des scénarios exportés`
              : 'Fichiers générés'}
          </div>
        </div>
      </div>

      {/* Map section */}
      <div className={styles.sectionBox}>
        <div className="fr-flex fr-justify-content-space-between fr-align-items-center fr-mb-3v">
          <h2 className={styles.sectionBoxTitle}>Couverture et intensité d'usage</h2>
        </div>

        {/* Map color mode filter */}
        <div className="fr-flex fr-flex-gap-2v fr-flex-wrap fr-mb-3v">
          {MAP_COLOR_MODES.map((mode) => (
            <Button
              key={mode.value}
              priority={mapColorMode === mode.value ? 'primary' : 'secondary'}
              size="small"
              onClick={() => setMapColorMode(mode.value)}
            >
              {mode.label}
            </Button>
          ))}
        </div>

        <div className={styles.mapLayout}>
          <div>
            <div className={styles.mapWrapper}>
              <PilotageDeploymentMapWrapper
                userType={effectiveMapType}
                isAdmin={isAdmin}
                coverageData={coverageData}
                isFiltered={Boolean(effectiveRegion)}
                colorMode={mapColorMode}
              />
            </div>
          </div>

          <div className="fr-flex fr-direction-column fr-flex-gap-3v">
            {/* Classement régions */}
            <div className={styles.rankingCard}>
              <h3 className={styles.rankingTitle}>Classement régions</h3>
              {regionRanking.length === 0 ? (
                <p className={fr.cx('fr-text--sm')}>Aucune donnée</p>
              ) : (
                regionRanking.map((item, idx) => (
                  <div key={item.region} className={classNames(styles.rankingRow, 'fr-flex', 'fr-align-items-center')}>
                    <span className={styles.rankingBadge}>{idx + 1}</span>
                    <span className={styles.rankingRegion}>{item.region}</span>
                    <span className={styles.rankingScore}>{item.count} scén.</span>
                  </div>
                ))
              )}
            </div>

            {/* Légende */}
            <div className={styles.legendCard}>
              <div className={styles.legendTitle}>Légende</div>
              {legendItems.map((item) => (
                <div key={item.label} className="fr-flex fr-align-items-center fr-flex-gap-2v fr-mb-1v">
                  <span className={`${styles.legendSwatch} ${item.swatchClass}`} />
                  <span>{item.label}</span>
                </div>
              ))}
              {!effectiveRegion && (
                <p className={`${fr.cx('fr-text--sm')} ${styles.legendHint} fr-text-mention--grey fr-mt-2v`}>
                  Sélectionnez une région pour zoomer
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Usage par typologie d'acteur */}
      <div className={styles.belowMapRow}>
        <div className={classNames(styles.sectionBox, 'fr-mb-0')}>
          <h2 className={classNames(styles.sectionBoxTitle, 'fr-mb-4v')}>Usage par typologie d'acteur</h2>
          {typologyUsage.length === 0 ? (
            <p className={fr.cx('fr-text--sm')}>Aucune donnée disponible</p>
          ) : (
            typologyUsage.map((item) => (
              <div key={item.type} className={classNames(styles.typologyRow, 'fr-flex', 'fr-align-items-center')}>
                <span className={styles.typologyLabel}>{item.label}</span>
                <div className={styles.typologyBarTrack}>
                  <div className={styles.typologyBarFill} style={{ width: `${item.pct}%` }} />
                </div>
                <span className={styles.typologyPct}>{item.pct}%</span>
              </div>
            ))
          )}
        </div>

        {/* Couverture EPCI */}
        <div className={classNames(styles.sectionBox, 'fr-mb-0')}>
          <h2 className={classNames(styles.sectionBoxTitle, 'fr-mb-4v')}>Couverture EPCI</h2>
          <div className={classNames(styles.kpiTileNum, styles.kpiTileNumLarge)}>
            {data.kpis.coverageRate}
            <span className={styles.kpiTileNumUnit}>%</span>
          </div>
          <div className={classNames(styles.kpiTileSub, 'fr-mb-3v')}>EPCI couverts par au moins un scénario</div>
          <div className="fr-mt-3v">
            {typologyUsage.slice(0, 3).map((item) => (
              <div key={item.type} className={styles.coverageRow}>
                <span className="fr-text-label--grey">{item.label}</span>
                <span className={classNames('fr-text-title--blue-france', 'fr-text--bold')}>{item.count} scén.</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ADMIN-only sections */}
      {isAdmin && (
        <>
          {/* Scénarios récents */}
          <h2 className={fr.cx('fr-h4', 'fr-mb-3v', 'fr-mt-6v')}>Scénarios récents</h2>
          <PilotageScenariosTable />

          {/* Estimations des besoins en logements par région */}
          <h2 className={fr.cx('fr-h4', 'fr-mt-8v', 'fr-mb-3v')}>Estimations des besoins en logements par région</h2>
          {data.housingByRegion.length > 0 ? (
            <Table
              fixed
              noCaption
              headers={['Région', 'Besoins en flux', 'Lutte contre le mal-logement', 'Logements vacants', 'Total besoins']}
              data={data.housingByRegion.map((row) => [
                row.region,
                row.totalFlux.toLocaleString('fr-FR'),
                row.totalStock.toLocaleString('fr-FR'),
                row.totalVacant.toLocaleString('fr-FR'),
                row.totalHousingNeeds.toLocaleString('fr-FR'),
              ])}
            />
          ) : (
            <p>Aucune donnée disponible</p>
          )}

          {/* Acteurs par région et type */}
          <h2 className={fr.cx('fr-h4', 'fr-mt-8v', 'fr-mb-3v')}>Acteurs par région et type</h2>
          {data.actorsByRegion.length > 0 ? (
            <Table
              fixed
              noCaption
              headers={['Région', "Type d'acteur", 'Nb utilisateurs', 'Nb scénarios', 'Nb EPCI couverts', 'Dernière activité']}
              data={data.actorsByRegion.map((row) => [
                row.region,
                USER_TYPE_LABELS[row.actorType as keyof typeof USER_TYPE_LABELS] ?? row.actorType,
                row.nbUsers,
                row.nbScenarios,
                row.nbEpcis,
                row.lastActivity ? dayjs(row.lastActivity).format('DD/MM/YYYY') : '-',
              ])}
            />
          ) : (
            <p>Aucune donnée disponible</p>
          )}
        </>
      )}
    </div>
  )
}
