export const roundPopulation = (value: number): number => {
  if (value >= 100000) {
    return Math.round(value / 1000) * 1000
  } else if (value >= 10000) {
    return Math.round(value / 500) * 500
  } else {
    return Math.round(value / 100) * 100
  }
}
