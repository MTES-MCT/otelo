import type { Metadata } from 'next'
import { TerritoiresVoisinsPage } from '~/components/territoires-voisins/territoires-voisins-page'

export const metadata: Metadata = {
  title: 'Territoires voisins - Otelo',
}

export default function TerritoiresVoisins() {
  return <TerritoiresVoisinsPage />
}
