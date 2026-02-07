import { useQuery } from '@tanstack/react-query'
import { useSession } from '~/lib/auth/client'
import { TUser } from '~/schemas/user'

export interface UsersResponse {
  userCount: number
  users: TUser[]
}

export const useUsers = () => {
  const { data: session } = useSession()

  const fetchUsers = async (): Promise<UsersResponse> => {
    try {
      const response = await fetch('/api/users')
      if (!response.ok) {
        throw new Error('Failed to fetch user simulations')
      }
      return response.json()
    } catch (error) {
      console.error('Error fetching user simulations:', error)
      return { userCount: 0, users: [] }
    }
  }

  const { data, isLoading } = useQuery({
    enabled: !!session && session.user.role === 'ADMIN',
    queryFn: fetchUsers,
    queryKey: ['users'],
  })

  return { data, isLoading }
}
