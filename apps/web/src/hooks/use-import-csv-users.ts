import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

interface ImportResult {
  created: number
  skipped: number
  validationErrors: Array<{ row: number; error: string }>
  totalRows: number
}

export const useImportCsvUsers = () => {
  const queryClient = useQueryClient()

  const importCsv = async (file: File): Promise<ImportResult> => {
    const formData = new FormData()
    formData.append('file', file)

    const response = await fetch('/api/users/import/csv', {
      method: 'POST',
      body: formData,
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || "Erreur lors de l'import")
    }

    return response.json()
  }

  const { isPending, mutateAsync } = useMutation({
    mutationFn: importCsv,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      queryClient.invalidateQueries({ queryKey: ['search-users'] })
      toast.success(`Import terminé : ${data.created} créé(s), ${data.skipped} ignoré(s)`)
      if (data.validationErrors.length > 0) {
        toast.warning(`${data.validationErrors.length} ligne(s) en erreur`)
      }
    },
    onError: () => {
      toast.error("Une erreur est survenue lors de l'import des utilisateurs")
    },
  })

  return { isPending, mutateAsync }
}
