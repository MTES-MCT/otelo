export interface RegionRatios {
  ratio25: number
  ratio35: {
    above35: number
    below35: number
  }
  ratio43: {
    above35: number
    below35: number
  }
  ratio45: number
}

export interface RatioConfig {
  [regionCode: string]: RegionRatios
}

export const ratioConfig: Record<string, RegionRatios> = {
  '11': {
    ratio25: 0.1729,
    ratio35: {
      above35: 0.0753,
      below35: 0.077,
    },
    ratio43: {
      above35: 0.017,
      below35: 0.0257,
    },
    ratio45: 0.1001,
  },
  default: {
    ratio25: 0.0025,
    ratio35: {
      above35: 0.0142,
      below35: 0.0101,
    },
    ratio43: {
      above35: 0.0441,
      below35: 0.0521,
    },
    ratio45: 0.0116,
  },
}
