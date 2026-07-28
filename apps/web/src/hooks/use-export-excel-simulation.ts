import { useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'

// L'API envoie les deux formes de la RFC 6266 : `filename*` (UTF-8, accents préservés) et
// `filename` translittéré en ASCII pour les clients anciens. On privilégie donc `filename*`.
const UTF8_FILENAME = /filename\*=UTF-8''([^;]+)/i
const ASCII_FILENAME = /filename="([^"]*)"|filename=([^;]+)/i

const parseFilename = (contentDisposition: string | null): string | undefined => {
  if (!contentDisposition) {
    return undefined
  }

  const utf8Match = contentDisposition.match(UTF8_FILENAME)
  if (utf8Match) {
    try {
      return decodeURIComponent(utf8Match[1])
    } catch {
      // Valeur mal encodée : on retombe sur la forme ASCII ci-dessous.
    }
  }

  const asciiMatch = contentDisposition.match(ASCII_FILENAME)
  return (asciiMatch?.[1] ?? asciiMatch?.[2])?.trim() || undefined
}

export const useExportExcelSimulation = () => {
  const exportSettings = async (id: string) => {
    try {
      const response = await fetch(`/api/export-excel/${id}`, {
        method: 'GET',
      })

      if (!response.ok) {
        throw new Error('Failed to export simulation')
      }

      const filename = parseFilename(response.headers.get('content-disposition')) ?? `scenario-${new Date().toISOString()}.xlsx`

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
