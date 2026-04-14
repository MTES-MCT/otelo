'use client'

import { fr } from '@codegouvfr/react-dsfr'
import Button from '@codegouvfr/react-dsfr/Button'
import { Card } from '@codegouvfr/react-dsfr/Card'
import { Select } from '@codegouvfr/react-dsfr/Select'
import { Table } from '@codegouvfr/react-dsfr/Table'
import { USER_TYPE_LABELS } from '@shared'
import dayjs from 'dayjs'
import { useMemo, useState } from 'react'
import { useExportPilotageStatistics } from '~/hooks/use-export-pilotage-statistics'
import { usePilotageStatistics } from '~/hooks/use-pilotage-statistics'

export default function PilotageTab() {
  const [selectedRegion, setSelectedRegion] = useState<string | undefined>(undefined)
  const [selectedDepartment, setSelectedDepartment] = useState<string | undefined>(undefined)
  const { data, isLoading, error } = usePilotageStatistics(selectedRegion, selectedDepartment)
  const { isPending: isExporting, mutateAsync: exportCsv } = useExportPilotageStatistics()

  const regions = data?.regions ?? []

  const filteredDepartments = useMemo(() => {
    if (!data?.departments) return []
    const depts = selectedRegion ? data.departments.filter((d) => d.region === selectedRegion) : data.departments
    // Deduplicate by department name
    return [...new Map(depts.map((d) => [d.name, d])).values()]
  }, [data?.departments, selectedRegion])

  const handleRegionChange = (value: string) => {
    setSelectedRegion(value || undefined)
    setSelectedDepartment(undefined) // Reset department when region changes
  }

  if (isLoading) {
    return <p>Chargement des données de pilotage...</p>
  }

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
      <div className={fr.cx('fr-grid-row', 'fr-grid-row--gutters', 'fr-mb-5v')} style={{ alignItems: 'flex-end' }}>
        <div className={fr.cx('fr-col-12', 'fr-col-md-3')}>
          <Select
            label="Filtrer par région"
            nativeSelectProps={{
              value: selectedRegion ?? '',
              onChange: (e) => handleRegionChange(e.target.value),
            }}
          >
            <option value="">Toutes les régions</option>
            {regions.map((region) => (
              <option key={region} value={region}>
                {region}
              </option>
            ))}
          </Select>
        </div>
        <div className={fr.cx('fr-col-12', 'fr-col-md-3')}>
          <Select
            label="Filtrer par département"
            nativeSelectProps={{
              value: selectedDepartment ?? '',
              onChange: (e) => setSelectedDepartment(e.target.value || undefined),
            }}
          >
            <option value="">Tous les départements</option>
            {filteredDepartments.map((dept) => (
              <option key={dept.name} value={dept.name}>
                {dept.name}
              </option>
            ))}
          </Select>
        </div>
        <div className={fr.cx('fr-col-12', 'fr-col-md-3')}>
          <Button
            iconId="ri-download-line"
            priority="secondary"
            disabled={isExporting}
            onClick={() => exportCsv({ region: selectedRegion, department: selectedDepartment })}
          >
            {isExporting ? 'Export en cours...' : 'Exporter en CSV'}
          </Button>
        </div>
      </div>

      <div className={fr.cx('fr-grid-row', 'fr-grid-row--gutters', 'fr-mb-5v')}>
        <div className={fr.cx('fr-col-12', 'fr-col-md-4')}>
          <Card
            title="Régions actives"
            titleAs="h3"
            desc={
              <>
                <span className={fr.cx('fr-display--lg', 'fr-mb-0')} style={{ display: 'block' }}>
                  {data.kpis.totalActiveRegions}
                </span>
                <span className={fr.cx('fr-text--sm')}>Régions avec au moins un scénario</span>
              </>
            }
          />
        </div>
        <div className={fr.cx('fr-col-12', 'fr-col-md-4')}>
          <Card
            title="Acteurs actifs"
            titleAs="h3"
            desc={
              <>
                <span className={fr.cx('fr-display--lg', 'fr-mb-0')} style={{ display: 'block' }}>
                  {data.kpis.totalActiveActors}
                </span>
                <span className={fr.cx('fr-text--sm')}>Utilisateurs ayant créé au moins un scénario</span>
              </>
            }
          />
        </div>
        <div className={fr.cx('fr-col-12', 'fr-col-md-4')}>
          <Card
            title="Couverture territoriale"
            titleAs="h3"
            desc={
              <>
                <span className={fr.cx('fr-display--lg', 'fr-mb-0')} style={{ display: 'block' }}>
                  {data.kpis.coverageRate}%
                </span>
                <span className={fr.cx('fr-text--sm')}>EPCI couverts par au moins un scénario</span>
              </>
            }
          />
        </div>
      </div>

      <h2 className={fr.cx('fr-mt-5v', 'fr-mb-3v')}>Acteurs par région et type</h2>
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

      <h2 className={fr.cx('fr-mt-8v', 'fr-mb-3v')}>Estimations des besoins en logements par région</h2>
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
    </div>
  )
}
