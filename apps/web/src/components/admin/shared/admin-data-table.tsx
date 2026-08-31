'use client'

import Pagination from '@codegouvfr/react-dsfr/Pagination'
import { type ColumnDef, flexRender, getCoreRowModel, getSortedRowModel, type SortingState, useReactTable } from '@tanstack/react-table'
import classNames from 'classnames'
import { useState } from 'react'
import styles from './admin-data-table.module.css'

type AdminDataTableProps<T> = {
  columns: ColumnDef<T, unknown>[]
  data: T[]
  /** Nombre total de pages côté serveur. La pagination n'est rendue qu'au-delà de 1. */
  pageCount?: number
  page?: number
  onPageChange?: (page: number) => void
  isLoading?: boolean
  isError?: boolean
  emptyLabel?: string
  onRowClick?: (row: T) => void
  isRowSelected?: (row: T) => boolean
}

// Tri local (les colonnes l'activent via `enableSorting`), pagination serveur
// (`manualPagination`) : trier ne doit pas déclencher d'aller-retour réseau.
export function AdminDataTable<T>({
  columns,
  data,
  emptyLabel = 'Aucun résultat',
  isError,
  isLoading,
  isRowSelected,
  onPageChange,
  onRowClick,
  page = 1,
  pageCount = 0,
}: AdminDataTableProps<T>) {
  const [sorting, setSorting] = useState<SortingState>([])

  const table = useReactTable({
    columns,
    data,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    manualPagination: true,
    onSortingChange: setSorting,
    pageCount,
    state: { sorting },
  })

  const renderPlaceholder = (label: string, isErrorRow = false) => (
    <tr>
      <td
        className={classNames(
          'fr-px-4v fr-py-8v fr-text--sm fr-text--center',
          isErrorRow ? 'fr-text-default--error' : 'fr-text-mention--grey',
        )}
        colSpan={columns.length}
      >
        {label}
      </td>
    </tr>
  )

  return (
    <div className={classNames('fr-table fr-m-0', styles.wrapper)}>
      <table className="fr-width-full">
        <thead>
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map((header) => {
                const canSort = header.column.getCanSort()
                const sortDirection = header.column.getIsSorted()

                return (
                  <th
                    className={canSort ? styles.sortableHeader : undefined}
                    key={header.id}
                    onClick={canSort ? header.column.getToggleSortingHandler() : undefined}
                    scope="col"
                    style={{ maxWidth: header.column.columnDef.maxSize, width: header.getSize() }}
                  >
                    <div className="fr-flex fr-align-items-center fr-flex-gap-1v">
                      {flexRender(header.column.columnDef.header, header.getContext())}
                      {canSort && (
                        <span
                          aria-hidden="true"
                          className={classNames(
                            'fr-text--xs',
                            sortDirection ? 'fr-text-action-high--blue-france' : styles.sortInactive,
                            sortDirection === 'asc'
                              ? 'fr-icon-arrow-up-line'
                              : sortDirection === 'desc'
                                ? 'fr-icon-arrow-down-line'
                                : 'fr-icon-arrow-up-down-line',
                          )}
                        />
                      )}
                    </div>
                  </th>
                )
              })}
            </tr>
          ))}
        </thead>
        <tbody>
          {isLoading
            ? renderPlaceholder('Chargement…')
            : isError
              ? renderPlaceholder('Erreur lors du chargement des données', true)
              : data.length === 0
                ? renderPlaceholder(emptyLabel)
                : table.getRowModel().rows.map((row) => (
                    <tr
                      className={classNames(onRowClick && styles.clickableRow, isRowSelected?.(row.original) && styles.selectedRow)}
                      key={row.id}
                      onClick={onRowClick ? () => onRowClick(row.original) : undefined}
                    >
                      {row.getVisibleCells().map((cell) => (
                        <td key={cell.id} style={{ maxWidth: cell.column.columnDef.maxSize, width: cell.column.getSize() }}>
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </td>
                      ))}
                    </tr>
                  ))}
        </tbody>
      </table>
      {pageCount > 1 && (
        <Pagination
          className="fr-flex fr-justify-content-center fr-mt-3w"
          count={pageCount}
          defaultPage={page}
          getPageLinkProps={(pageNumber) => ({
            href: '#',
            onClick: (event) => {
              event.preventDefault()
              onPageChange?.(pageNumber)
            },
          })}
        />
      )}
    </div>
  )
}
