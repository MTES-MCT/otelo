import { useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'

export const useExportSimulationsStatistics = () => {
  const exportSimulationsStatistics = async () => {
    try {
      const response = await fetch('/api/statistics/simulations', {
        method: 'GET',
      })

      if (!response.ok) {
        throw new Error('Failed to export simulations statistics')
      }

      const contentDisposition = response.headers.get('content-disposition')
      const filename = contentDisposition
        ? contentDisposition.split('filename=')[1].replace(/"/g, '')
        : `simulations-statistics-${new Date().toISOString().split('T')[0]}.csv`

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
      console.error('Failed to export simulations statistics:', error)
      throw error
    }
  }

  const { isPending, mutateAsync } = useMutation({
    mutationFn: exportSimulationsStatistics,
    onError: () => {
      toast.error("Une erreur est survenue lors de l'exportation des statistiques de simulations")
    },
  })

  return { isPending, mutateAsync }
}
