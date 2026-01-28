export const formatNumber = (value: number): string => {
  try {
    return value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ')
  } catch (_error) {
    return `N/C`
  }
}
