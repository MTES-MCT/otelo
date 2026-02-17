import { useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'

export const useExportCsvUsers = () => {
  const exportCsv = async () => {
    const response = await fetch('/api/users/export/csv', {
      method: 'GET',
    })

    if (!response.ok) {
      throw new Error('Failed to export users')
    }

    const contentDisposition = response.headers.get('content-disposition')
    const filename = contentDisposition
      ? contentDisposition.split('filename=')[1].replace(/"/g, '')
      : `export-utilisateurs-${new Date().toISOString().slice(0, 10)}.csv`

    const blob = await response.blob()

    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    window.URL.revokeObjectURL(url)
    document.body.removeChild(a)
  }

  const { isPending, mutateAsync } = useMutation({
    mutationFn: exportCsv,
    onError: () => {
      toast.error("Une erreur est survenue lors de l'exportation des utilisateurs")
    },
  })

  return { isPending, mutateAsync }
}
