import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

export interface Collaborator {
  id: string
  createdAt: string
  userId: string
  user: { id: string; email: string; firstname: string; lastname: string }
  inviter: { id: string; email: string; firstname: string; lastname: string }
}

export const useCollaborators = (simulationId: string) => {
  const { data, isLoading } = useQuery<Collaborator[]>({
    queryKey: ['collaborators', simulationId],
    queryFn: async () => {
      const res = await fetch(`/api/simulations/${simulationId}/collaborators`)
      if (!res.ok) throw new Error('Failed to fetch collaborators')
      return res.json()
    },
  })

  return { collaborators: data ?? [], isLoading }
}

export const useInviteCollaborator = (simulationId: string) => {
  const queryClient = useQueryClient()
  const router = useRouter()

  const { mutateAsync, isPending } = useMutation({
    mutationFn: async (email: string) => {
      const res = await fetch(`/api/simulations/${simulationId}/collaborators`, {
        method: 'POST',
        body: JSON.stringify({ email }),
        headers: { 'Content-Type': 'application/json' },
      })
      if (!res.ok) {
        const error = await res.json().catch(() => ({}))
        throw new Error(error.message || "Échec de l'invitation")
      }
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['collaborators', simulationId] })
      toast.success('Collaborateur invité avec succès')
      // Refresh server data so hasCollaborators is updated and collaboration features activate
      router.refresh()
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })

  return { invite: mutateAsync, isPending }
}

export const useRemoveCollaborator = (simulationId: string) => {
  const queryClient = useQueryClient()

  const { mutateAsync, isPending } = useMutation({
    mutationFn: async (userId: string) => {
      const res = await fetch(`/api/simulations/${simulationId}/collaborators/${userId}`, {
        method: 'DELETE',
      })
      if (!res.ok) throw new Error('Failed to remove collaborator')
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['collaborators', simulationId] })
      toast.success('Collaborateur retiré')
    },
    onError: () => {
      toast.error('Échec de la suppression du collaborateur')
    },
  })

  return { remove: mutateAsync, isPending }
}
