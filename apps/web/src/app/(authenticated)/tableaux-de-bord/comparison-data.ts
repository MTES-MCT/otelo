export interface ComparisonRow {
  label: string
  badge?: string
  value: string
  variant: 'light' | 'default'
}

export const COMPARISON_ROWS: ComparisonRow[] = [
  { label: 'Constructions neuves', value: '32 000', variant: 'light' },
  { label: 'Logements existants remobilisés', value: '12 000', variant: 'light' },
  { label: 'Projection de population', badge: 'BASSE', value: '40500 habitants en 2033', variant: 'default' },
  { label: 'Desserrement des ménages', badge: 'TENDANCIEL', value: '2300 ménages en 2033', variant: 'default' },
  { label: 'Taux de logements vacants', badge: 'STABLE', value: '0,5% en 2030', variant: 'default' },
  { label: 'Taux de résidences secondaires', badge: 'STABLE', value: '0,5% en 2030', variant: 'default' },
  { label: 'Renouvellement urbain', value: 'Après 2033', variant: 'default' },
  { label: 'Pic de ménages', value: 'Après 2033', variant: 'default' },
]
