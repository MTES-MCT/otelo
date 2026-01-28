import { useQuery } from '@tanstack/react-query'
import { useSearchParams } from 'next/navigation'
import { useCallback, useEffect } from 'react'
import { UsersResponse } from '~/hooks/use-users'

const REQUIRED_MINIMUM_LENGTH = 2
const DEBOUNCE_TIME = 500

export const useSearchUsers = () => {
  const searchParams = useSearchParams()
  const q = searchParams.get('q')

  const searchUsers = async (): Promise<UsersResponse> => {
    try {
      const response = await fetch(`/api/users/search?q=${q}`)

      if (!response.ok) {
        throw new Error('Failed to search users')
      }
      const data = await response.json()
      return data
    } catch (error) {
      console.error('Failed to search users with error:', error)
      return { userCount: 0, users: [] }
    }
  }

  const { data, isLoading, refetch } = useQuery({
    enabled: !!q && q.length >= REQUIRED_MINIMUM_LENGTH,
    queryFn: searchUsers,
    queryKey: ['search-users', q],
  })

  const debouncedRefetch = useCallback(() => {
    const timeout = setTimeout(() => {
      if (q && q.length >= REQUIRED_MINIMUM_LENGTH) {
        refetch()
      }
    }, DEBOUNCE_TIME)

    return () => clearTimeout(timeout)
  }, [q, refetch])

  useEffect(() => {
    return debouncedRefetch()
  }, [q, debouncedRefetch])

  return { data, isLoading }
}
