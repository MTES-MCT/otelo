'use client'

import { toPng } from 'html-to-image'
import { useCallback, useRef } from 'react'
import { toast } from 'sonner'
import { trackEvent } from '~/lib/tracking'

export const useChartDownload = (fileName: string) => {
  const ref = useRef<HTMLDivElement>(null)

  const download = useCallback(async () => {
    if (!ref.current) return

    try {
      const dataUrl = await toPng(ref.current, {
        backgroundColor: '#fff',
        pixelRatio: 2,
        height: ref.current.scrollHeight,
        width: ref.current.scrollWidth,
        filter: (node) => {
          if (node instanceof HTMLElement) {
            if (node.dataset.chartDownloadButton !== undefined) return false
            if (node.dataset.chartDownloadExclude !== undefined) return false
          }
          return true
        },
      })

      const link = document.createElement('a')
      link.download = `${fileName}-${new Date().toISOString().slice(0, 10)}.png`
      link.href = dataUrl
      link.click()

      // I3 — quels graphiques sont réellement emportés dans les documents des utilisateurs.
      // Aucune trace en base : le rendu est entièrement côté navigateur.
      trackEvent({ action: 'telechargement graphique', category: 'Infographie', name: fileName })
    } catch {
      toast.error("Erreur lors du téléchargement de l'image")
    }
  }, [fileName])

  return { ref, download }
}
