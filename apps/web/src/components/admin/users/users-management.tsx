'use client'

import { parseAsInteger, parseAsString, useQueryStates } from 'nuqs'
import { FC, useCallback } from 'react'
import { useSearchUsers } from '~/hooks/use-search-users'
import { useUsers } from '~/hooks/use-users'
import { UsersTable } from './users-table'
import { UsersTableHeader } from './users-table-header'

export const UsersManagement: FC = () => {
  const [queryStates, setQueryStates] = useQueryStates(
    {
      limit: parseAsInteger.withDefault(25),
      page: parseAsInteger.withDefault(1),
      q: parseAsString.withDefault(''),
      sortBy: parseAsString.withDefault(''),
      sortOrder: parseAsString.withDefault(''),
    },
    { shallow: true },
  )

  const { data: usersResponse } = useUsers(
    queryStates.page,
    queryStates.limit,
    queryStates.sortBy || undefined,
    queryStates.sortOrder || undefined,
  )
  const { data: usersSearchResponse } = useSearchUsers(queryStates.q)

  const isSearching = !!queryStates.q
  const userCount = isSearching ? (usersSearchResponse?.userCount ?? 0) : (usersResponse?.userCount ?? 0)

  const handleSearchQueryChange = useCallback(
    (q: string) => {
      setQueryStates({ q, page: 1 })
    },
    [setQueryStates],
  )

  const handlePageChange = useCallback(
    (page: number) => {
      setQueryStates({ page })
    },
    [setQueryStates],
  )

  const handleLimitChange = useCallback(
    (limit: number) => {
      setQueryStates({ limit, page: 1 })
    },
    [setQueryStates],
  )

  const handleSortChange = useCallback(
    (sortBy: string, sortOrder: string) => {
      setQueryStates({ sortBy, sortOrder, page: 1 })
    },
    [setQueryStates],
  )

  return (
    <>
      <UsersTableHeader userCount={userCount} searchQuery={queryStates.q} onSearchQueryChange={handleSearchQueryChange} />
      <UsersTable
        users={isSearching ? (usersSearchResponse?.users ?? []) : (usersResponse?.users ?? [])}
        totalPages={isSearching ? 0 : (usersResponse?.totalPages ?? 0)}
        isSearching={isSearching}
        queryStates={queryStates}
        sortBy={queryStates.sortBy || undefined}
        sortOrder={queryStates.sortOrder || undefined}
        onPageChange={handlePageChange}
        onLimitChange={handleLimitChange}
        onSortChange={handleSortChange}
      />
    </>
  )
}
