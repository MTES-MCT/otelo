'use client'

import { useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'

type ExportParams = Record<string, string | undefined>

/** Reprend le nom de fichier décidé par l'API, qui porte la période demandée. */
function parseFilename(contentDisposition: string | null, fallback: string): string {
  const match = contentDisposition?.match(/filename\*?=(?:UTF-8'')?"?([^";]+)"?/i)

  return match ? decodeURIComponent(match[1]) : fallback
}

function triggerDownload(blob: Blob, filename: string): void {
  const url = window.URL.createObjectURL(blob)
  const link = document.createElement('a')

  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  window.URL.revokeObjectURL(url)
}

/**
 * Téléchargement d'un export CSV.
 *
 * Une seule implémentation pour tous les exports de l'administration : la logique
 * `fetch` → `blob` → ancre temporaire était dupliquée dans six hooks quasi identiques.
 */
export function useCsvExport(endpoint: string, fallbackFilename: string) {
  const { isPending, mutateAsync } = useMutation({
    mutationFn: async (params: ExportParams = {}) => {
      const query = new URLSearchParams()

      for (const [key, value] of Object.entries(params)) {
        if (value) {
          query.set(key, value)
        }
      }

      const queryString = query.toString()
      const response = await fetch(`${endpoint}${queryString ? `?${queryString}` : ''}`)

      if (!response.ok) {
        throw new Error(`Failed to export ${endpoint}`)
      }

      const blob = await response.blob()

      triggerDownload(blob, parseFilename(response.headers.get('content-disposition'), fallbackFilename))
    },
    onError: (error) => {
      console.error(`Failed to export ${endpoint}:`, error)
      toast.error("Une erreur est survenue lors de l'export")
    },
  })

  return { exportCsv: mutateAsync, isPending }
}
