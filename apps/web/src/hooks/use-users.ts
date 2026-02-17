import { useQuery } from '@tanstack/react-query'
import { TUser } from '~/schemas/user'

export interface UsersResponse {
  userCount: number
  users: TUser[]
  page: number
  limit: number
  totalPages: number
}

export const useUsers = (page = 1, limit = 25) => {
  const fetchUsers = async (): Promise<UsersResponse> => {
    try {
      const response = await fetch(`/api/users?page=${page}&limit=${limit}`)
      if (!response.ok) {
        throw new Error('Failed to fetch users')
      }
      return response.json()
    } catch (error) {
      console.error('Error fetching users:', error)
      return { userCount: 0, users: [], page, limit, totalPages: 0 }
    }
  }

  return useQuery({
    queryFn: fetchUsers,
    queryKey: ['users', page, limit],
  })
}
