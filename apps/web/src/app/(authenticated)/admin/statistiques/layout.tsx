import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Statistiques métier',
}

export default function StatistiquesLayout({ children }: { children: React.ReactNode }) {
  return children
}
