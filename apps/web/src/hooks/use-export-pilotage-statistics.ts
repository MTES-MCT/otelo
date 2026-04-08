import { useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'

export const useExportPilotageStatistics = () => {
  const exportPilotageStatistics = async (filters?: { region?: string; department?: string }) => {
    try {
      const params = new URLSearchParams()
      if (filters?.region) params.set('region', filters.region)
      if (filters?.department) params.set('department', filters.department)
      const query = params.toString() ? `?${params.toString()}` : ''

      const response = await fetch(`/api/statistics/pilotage/export${query}`, {
        method: 'GET',
      })

      if (!response.ok) {
        throw new Error('Failed to export pilotage statistics')
      }

      const contentDisposition = response.headers.get('content-disposition')
      const filename = contentDisposition
        ? contentDisposition.split('filename=')[1].replace(/"/g, '')
        : `pilotage-statistics-${new Date().toISOString().split('T')[0]}.csv`

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
      console.error('Failed to export pilotage statistics:', error)
      throw error
    }
  }

  const { isPending, mutateAsync } = useMutation({
    mutationFn: exportPilotageStatistics,
    onError: () => {
      toast.error("Une erreur est survenue lors de l'exportation des données de pilotage")
    },
  })

  return { isPending, mutateAsync }
}
