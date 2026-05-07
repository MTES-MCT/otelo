'use client'

import { fr } from '@codegouvfr/react-dsfr'
import { Pagination } from '@codegouvfr/react-dsfr/Pagination'
import { Select } from '@codegouvfr/react-dsfr/Select'
import { Table } from '@codegouvfr/react-dsfr/Table'
import { USER_TYPE_LABELS, UserType } from '@shared'
import { createColumnHelper, flexRender, getCoreRowModel, getPaginationRowModel, useReactTable } from '@tanstack/react-table'
import classNames from 'classnames'
import dayjs from 'dayjs'
import type { ReactNode } from 'react'
import { useState } from 'react'
import { AutocompleteInput } from '~/components/simulations/autocomplete/autocomplete-input'
import { type PilotageScenarioItem, usePilotageScenariosList } from '~/hooks/use-pilotage-scenarios-list'
import styles from './pilotage-scenarios-table.module.css'

const PAGE_SIZE = 20

const columnHelper = createColumnHelper<PilotageScenarioItem>()

const columns = [
  columnHelper.accessor('simulationName', { header: 'Simulation' }),
  columnHelper.accessor('epcis', {
    header: 'EPCI(s)',
    cell: (info) => {
      const val = info.getValue()
      const count = val ? val.split(',').filter(Boolean).length : 0
      return count > 0 ? <span className={styles.epciBadge}>{count} EPCI</span> : <span>-</span>
    },
  }),
  columnHelper.accessor('userTypology', {
    header: 'Typologie',
    cell: (info) => {
      const val = info.getValue()
      return val ? (USER_TYPE_LABELS[val as UserType] ?? val) : '-'
    },
  }),
  columnHelper.accessor('lastActivity', {
    header: 'Activité',
    cell: (info) => dayjs(info.getValue()).format('DD/MM/YYYY'),
  }),
  columnHelper.display({
    id: 'exports',
    header: '',
    cell: ({ row }) => {
      const { hasExportExcel, hasExportPpt } = row.original
      if (!hasExportExcel && !hasExportPpt) return null
      return (
        <span className={classNames(styles.exportsCell, 'fr-text-mention--grey')}>
          {hasExportExcel && <span title="Export Excel">XLS </span>}
          {hasExportPpt && <span title="Export PowerPoint">PPT</span>}
        </span>
      )
    },
  }),
]

export function PilotageScenariosTable() {
  const [territoire, setTerritoire] = useState('')
  const [typology, setTypology] = useState('')
  const [autocompleteKey, setAutocompleteKey] = useState(0)

  const { data = [], isLoading, error } = usePilotageScenariosList(territoire || undefined, typology || undefined)

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: PAGE_SIZE } },
  })

  const { pageIndex, pageSize } = table.getState().pagination
  const totalPages = table.getPageCount()
  const from = pageIndex * pageSize + 1
  const to = Math.min((pageIndex + 1) * pageSize, data.length)

  return (
    <div>
      <div className={classNames(fr.cx('fr-grid-row', 'fr-grid-row--gutters', 'fr-mb-3v'), 'fr-align-items-end')}>
        <div className={fr.cx('fr-col-12', 'fr-col-md-4')}>
          <AutocompleteInput
            key={autocompleteKey}
            label="Filtrer par territoire"
            hintText="Recherchez un EPCI ou une commune"
            onClick={(item) => {
              const code = 'codeEpci' in item ? item.codeEpci : item.code
              setTerritoire(code)
              table.setPageIndex(0)
            }}
          />
          {territoire && (
            <button
              className={fr.cx('fr-btn', 'fr-btn--tertiary-no-outline', 'fr-btn--sm', 'fr-mt-1v')}
              onClick={() => {
                setTerritoire('')
                setAutocompleteKey((k) => k + 1)
                table.setPageIndex(0)
              }}
            >
              Effacer le filtre territoire
            </button>
          )}
        </div>
        <div className={fr.cx('fr-col-12', 'fr-col-md-4')}>
          <Select
            label="Filtrer par typologie"
            nativeSelectProps={{
              value: typology,
              onChange: (e) => {
                setTypology(e.target.value)
                table.setPageIndex(0)
              },
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
      </div>

      {isLoading && <p>Chargement des scénarios...</p>}
      {error && (
        <div className={fr.cx('fr-alert', 'fr-alert--error')}>
          <p>Erreur lors du chargement des scénarios</p>
        </div>
      )}

      {!isLoading && !error && (
        <>
          <Table
            fixed
            noCaption
            headers={['Simulation', 'EPCI(s)', 'Typologie', 'Activité', '']}
            data={
              table.getRowModel().rows.length === 0
                ? [['Aucun scénario trouvé', '', '', '', '']]
                : table
                    .getRowModel()
                    .rows.map(
                      (row) =>
                        row.getVisibleCells().map((cell) => flexRender(cell.column.columnDef.cell, cell.getContext())) as ReactNode[],
                    )
            }
          />

          {totalPages > 1 && (
            <div className="fr-flex fr-direction-column fr-align-items-center fr-mt-2v">
              <Pagination
                key={pageIndex}
                count={totalPages}
                defaultPage={pageIndex + 1}
                getPageLinkProps={(pageNumber) => ({
                  href: '#',
                  onClick: (e: React.MouseEvent) => {
                    e.preventDefault()
                    table.setPageIndex(pageNumber - 1)
                  },
                })}
              />
              {data.length > 0 && (
                <p className={classNames(fr.cx('fr-text--sm', 'fr-mt-1v'), 'fr-text-mention--grey')}>
                  {from}–{to} sur {data.length} scénarios
                </p>
              )}
            </div>
          )}
        </>
      )}
    </div>
  )
}
