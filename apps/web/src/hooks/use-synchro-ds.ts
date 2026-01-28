import { useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'

export const useSynchroDs = () => {
  const getCronSynchro = async () => {
    try {
      const response = await fetch(`/api/cron/synchro`)

      if (!response.ok) {
        throw new Error('Failed to synchro ds')
      }
    } catch {
      return
    }
  }

  return useMutation({
    mutationFn: getCronSynchro,
    onSuccess: () => {
      toast.success('Synchronisation Démarches Simplifiées effectuée avec succès')
    },
    onError: () => {
      toast.error('Erreur lors de la synchronisation Démarches Simplifiées')
    },
  })
}
