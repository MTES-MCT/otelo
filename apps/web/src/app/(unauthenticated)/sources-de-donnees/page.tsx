import type { Metadata } from 'next'
import { Suspense } from 'react'
import { SourcesDeDonneesContent } from './sources-de-donnees-content'

export const metadata: Metadata = {
  title: 'Sources de données - Otelo',
  description: 'Liste des sources de données mobilisées dans Otelo, leur millésime et leur usage dans les étapes du parcours.',
}

export default function SourcesDeDonneesPage() {
  return (
    <Suspense>
      <SourcesDeDonneesContent />
    </Suspense>
  )
}
