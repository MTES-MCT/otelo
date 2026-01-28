export interface CoefficientConfig {
  baseCoeff: {
    [regionCode: string]: number
  }
}

export const coefficientConfig: CoefficientConfig = {
  baseCoeff: {
    '01': 4.0,
    '02': 4.0,
    '03': 4.0,
    '04': 4.0,
    default: 6.0,
  },
}
