/**
 * Palette des graphiques d'administration.
 *
 * Couleurs issues du DSFR, ordonnées pour rester distinguables en série : l'index d'une
 * série doit rester stable d'un graphique à l'autre pour qu'une même catégorie garde
 * sa couleur d'un écran au suivant.
 */
export const ADMIN_CHART_COLORS = [
  '#000091', // bleu France
  '#1f8d49', // vert émeraude
  '#e8944a', // orange terre de sienne
  '#a94645', // brun caramel
  '#8585f6', // violet
  '#009081', // vert menthe
  '#a558a0', // parme
  '#417dc4', // bleu ciel
  '#716043', // beige
  '#ce614a', // orange brique
  '#60e0d0', // turquoise
  '#c3992a', // jaune tournesol
] as const

export const ADMIN_CHART_GRID = 'var(--border-default-grey)'

export function chartColor(index: number): string {
  return ADMIN_CHART_COLORS[index % ADMIN_CHART_COLORS.length]
}
