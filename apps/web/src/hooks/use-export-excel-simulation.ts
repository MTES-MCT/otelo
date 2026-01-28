import { useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'

export const useExportExcelSimulation = () => {
  const exportSettings = async (id: string) => {
    try {
      const response = await fetch(`/api/export-excel/${id}`, {
        method: 'GET',
      })

      if (!response.ok) {
        throw new Error('Failed to export simulation')
      }

      const contentDisposition = response.headers.get('content-disposition')
      const filename = contentDisposition
        ? contentDisposition.split('filename=')[1].replace(/"/g, '')
        : `scenario-${new Date().toISOString()}.xlsx`

      const blob = await response.blob()

      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error('Failed to export simulation settings:', error)
      throw error
    }
  }

  const { isPending, mutateAsync } = useMutation({
    mutationFn: exportSettings,
    onError: () => {
      toast.error("Une erreur est survenue lors de l'exportation de la simulation")
    },
  })

  return { isPending, mutateAsync }
}
