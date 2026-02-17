'use client'

import Button from '@codegouvfr/react-dsfr/Button'
import { createModal } from '@codegouvfr/react-dsfr/Modal'
import { Pagination } from '@codegouvfr/react-dsfr/Pagination'
import Select from '@codegouvfr/react-dsfr/Select'
import {
  type Column,
  type ColumnDef,
  type ColumnFiltersState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  type SortingState,
  useReactTable,
} from '@tanstack/react-table'
import classNames from 'classnames'
import dayjs from 'dayjs'
import { FC, useMemo, useState } from 'react'
import { useDeleteUser } from '~/hooks/use-delete-user'
import { useStartImpersonation } from '~/hooks/use-impersonation'
import { useUpdateUserAccess } from '~/hooks/use-update-user-access'
import { TUser } from '~/schemas/user'
import styles from './users-table.module.css'

declare module '@tanstack/react-table' {
  interface ColumnMeta<TData, TValue> {
    filterType?: 'text' | 'select'
    options?: { label: string; value: string }[]
  }
}

interface UserRowActionsProps {
  user: TUser
  onDelete: (userId: string) => void
  onImpersonate: (userId: string) => void
}

const UserRowActions: FC<UserRowActionsProps> = ({ user, onDelete, onImpersonate }) => {
  const modalActions = useMemo(
    () =>
      createModal({
        id: `delete-user-modal-${user.id}`,
        isOpenedByDefault: false,
      }),
    [user.id],
  )

  return (
    <>
      <div className={styles.actions}>
        {user.role === 'USER' && (
          <i
            style={{ cursor: 'pointer' }}
            onClick={() => onImpersonate(user.id)}
            className="ri-user-follow-line"
            title="Usurper cet utilisateur"
          />
        )}
        <i style={{ cursor: 'pointer' }} onClick={modalActions.open} className="ri-delete-bin-5-fill" />
      </div>
      <modalActions.Component title="Êtes vous sûr de vouloir supprimer cet utilisateur ?">
        <p>Cette action est irréversible. L&apos;utilisateur perd ses droits et ses accès à Otelo.</p>
        <div className={styles.actionsModalCtasContainer}>
          <Button priority="secondary" onClick={modalActions.close}>
            Annuler
          </Button>
          <Button className={styles.deleteCta} iconId="ri-delete-bin-5-fill" onClick={() => onDelete(user.id)}>
            Supprimer
          </Button>
        </div>
      </modalActions.Component>
    </>
  )
}

function getColumns(
  updateUserAccess: (params: { userId: string; hasAccess: boolean }) => void,
  deleteUser: (userId: string) => void,
  startImpersonation: (params: { userId: string }) => void,
  isPending: boolean,
): ColumnDef<TUser>[] {
  return [
    {
      id: 'fullName',
      header: 'Nom et Prénom',
      accessorFn: (row) => `${row.firstname} ${row.lastname}`,
      filterFn: 'includesString',
      meta: { filterType: 'text' },
      cell: ({ getValue }) => <span className={styles.nameCell}>{getValue<string>()}</span>,
    },
    {
      accessorKey: 'email',
      header: 'Email',
      filterFn: 'includesString',
      meta: { filterType: 'text' },
      cell: ({ getValue }) => <span className={styles.emailCell}>{getValue<string>()}</span>,
    },
    {
      accessorKey: 'role',
      header: 'Rôle',
      cell: ({ row }) => {
        const user = row.original
        return <div className={classNames('fr-badge', user.role === 'ADMIN' ? styles.adminBadge : styles.userBadge)}>{user.role}</div>
      },
    },
    {
      accessorKey: 'createdAt',
      header: 'Date de création',
      enableColumnFilter: false,
      cell: ({ getValue }) => dayjs(getValue<Date>()).format('DD/MM/YYYY'),
    },
    {
      accessorKey: 'lastLoginAt',
      header: 'Date de dernière connexion',
      enableColumnFilter: false,
      cell: ({ getValue }) => dayjs(getValue<Date>()).format('DD/MM/YYYY - HH:mm'),
    },
    {
      accessorKey: 'hasAccess',
      header: 'Accès',
      enableSorting: false,
      filterFn: (row, columnId, filterValue) => {
        if (filterValue === '') return true
        const val = row.getValue<boolean>(columnId)
        return filterValue === 'true' ? val : !val
      },
      size: 100,
      maxSize: 100,
      meta: {
        filterType: 'select',
        options: [
          { label: 'Tous', value: '' },
          { label: 'Oui', value: 'true' },
          { label: 'Non', value: 'false' },
        ],
      },
      cell: ({ row }) => {
        const user = row.original
        return (
          <Select
            label=""
            nativeSelectProps={{
              value: user.hasAccess ? 'authorized' : 'unauthorized',
              onChange: (e) => {
                const newAccess = e.target.value === 'authorized'
                updateUserAccess({ userId: user.id, hasAccess: newAccess })
              },
              disabled: isPending,
            }}
            className={styles.accessSelect}
          >
            <option value="authorized">✅</option>
            <option value="unauthorized">❌</option>
          </Select>
        )
      },
    },
    {
      accessorKey: 'engaged',
      header: 'Démarches simplifiées',
      enableSorting: false,
      filterFn: (row, columnId, filterValue) => {
        if (filterValue === '') return true
        const val = row.getValue<boolean>(columnId)
        return filterValue === 'true' ? val : !val
      },
      size: 100,
      maxSize: 100,
      meta: {
        filterType: 'select',
        options: [
          { label: 'Tous', value: '' },
          { label: 'Oui', value: 'true' },
          { label: 'Non', value: 'false' },
        ],
      },
      cell: ({ row }) => {
        const user = row.original
        if (user.role === 'USER') {
          return user.engaged ? '✅' : '❌'
        }
        return <div className={classNames('fr-badge', styles.adminBadge)}>{user.role}</div>
      },
    },
    {
      id: 'actions',
      header: () => <div style={{ textAlign: 'right' }}>Actions</div>,
      enableSorting: false,
      enableColumnFilter: false,
      cell: ({ row }) => (
        <UserRowActions user={row.original} onDelete={deleteUser} onImpersonate={(userId) => startImpersonation({ userId })} />
      ),
    },
  ]
}

function ColumnFilter<TData>({ column }: { column: Column<TData> }) {
  const meta = column.columnDef.meta
  if (!meta?.filterType) return null

  if (meta.filterType === 'select') {
    return (
      <select
        className="fr-select"
        value={(column.getFilterValue() as string) ?? ''}
        onChange={(e) => column.setFilterValue(e.target.value || undefined)}
        onClick={(e) => e.stopPropagation()}
        style={{ marginTop: '0.25rem', padding: '0.25rem', fontSize: '0.75rem' }}
      >
        {meta.options?.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    )
  }

  return (
    <input
      className="fr-input"
      type="text"
      value={(column.getFilterValue() as string) ?? ''}
      onChange={(e) => column.setFilterValue(e.target.value || undefined)}
      onClick={(e) => e.stopPropagation()}
      placeholder="Filtrer..."
      style={{ marginTop: '0.25rem', padding: '0.25rem', fontSize: '0.75rem' }}
    />
  )
}

function SortableHeader<TData>({ column, label }: { column: Column<TData>; label: string }) {
  const canSort = column.getCanSort()
  const sorted = column.getIsSorted()

  const sortIndicator =
    sorted === 'asc' ? 'ri-arrow-up-line' : sorted === 'desc' ? 'ri-arrow-down-line' : canSort ? 'ri-arrow-up-down-line' : ''

  return (
    <div>
      <div
        onClick={canSort ? column.getToggleSortingHandler() : undefined}
        style={{ cursor: canSort ? 'pointer' : 'default', userSelect: 'none', whiteSpace: 'nowrap' }}
      >
        {label}
        <span className={classNames('fr-ml-1v fr-text-title--blue-france', sortIndicator, styles.sortIndicator)}></span>
      </div>
      {column.getCanFilter() && <ColumnFilter column={column} />}
    </div>
  )
}

const PAGE_SIZE_OPTIONS = [5, 10, 25, 50]

interface UsersTableProps {
  users: TUser[]
  totalPages: number
  isSearching: boolean
  queryStates: { limit: number; page: number; q: string }
  onPageChange: (page: number) => void
  onLimitChange: (limit: number) => void
}

export const UsersTable: FC<UsersTableProps> = ({ users, totalPages, isSearching, queryStates, onPageChange, onLimitChange }) => {
  const { mutate: updateUserAccess, isPending } = useUpdateUserAccess()
  const { mutate: deleteUser } = useDeleteUser()
  const { startImpersonation } = useStartImpersonation()

  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])

  const columns = useMemo(
    () => getColumns(updateUserAccess, deleteUser, startImpersonation, isPending),
    [updateUserAccess, deleteUser, startImpersonation, isPending],
  )

  const table = useReactTable({
    data: users,
    columns,
    state: { sorting, columnFilters },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
  })

  return (
    <div>
      <div className="fr-table" style={{ overflowX: 'auto' }}>
        <table style={{ display: 'table' }}>
          <thead>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    style={{
                      width: header.getSize(),
                      maxWidth: header.column.columnDef.maxSize,
                    }}
                  >
                    {header.isPlaceholder ? null : (
                      <SortableHeader
                        column={header.column}
                        label={flexRender(header.column.columnDef.header, header.getContext()) as string}
                      />
                    )}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="fr-text--center">
                  Aucun utilisateur trouvé
                </td>
              </tr>
            ) : (
              table.getRowModel().rows.map((row) => (
                <tr key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <td
                      key={cell.id}
                      style={{
                        width: cell.column.getSize(),
                        maxWidth: cell.column.columnDef.maxSize,
                      }}
                    >
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {!isSearching && (
        <div className={styles.paginationContainer}>
          <div className={styles.paginationCenter}>
            {totalPages > 1 && (
              <Pagination
                count={totalPages}
                defaultPage={queryStates.page}
                getPageLinkProps={(pageNumber) => ({
                  href: '#',
                  onClick: (e: React.MouseEvent) => {
                    e.preventDefault()
                    onPageChange(pageNumber)
                  },
                })}
              />
            )}
          </div>
          <div className={styles.pageSizeSelector}>
            <label htmlFor="page-size-select">Résultats par page :</label>
            <select
              id="page-size-select"
              className="fr-select"
              value={queryStates.limit}
              onChange={(e) => onLimitChange(Number(e.target.value))}
              style={{ width: '80px', padding: '0.25rem 0.5rem' }}
            >
              {PAGE_SIZE_OPTIONS.map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}
    </div>
  )
}
