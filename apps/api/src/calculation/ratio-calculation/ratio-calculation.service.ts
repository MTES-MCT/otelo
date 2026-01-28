import { Inject, Injectable } from '@nestjs/common'
import { TScenario } from '~/schemas/scenarios/scenario'

interface RegionRatios {
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

interface RatioConfig {
  [regionCode: string]: RegionRatios
}

@Injectable()
export class RatioCalculationService {
  constructor(
    @Inject('RATIO_CONFIG')
    private readonly ratioConfig: RatioConfig,
  ) {}

  getRatio43(params: TScenario, regionCode: string): number {
    const config = this.ratioConfig[regionCode] ?? this.ratioConfig.default
    return params.b13_taux_effort < 35 ? config.ratio43.below35 : config.ratio43.above35
  }

  getRatio25(regionCode: string): number {
    const config = this.ratioConfig[regionCode] ?? this.ratioConfig.default
    return config.ratio25
  }

  getRatio35(params: TScenario, regionCode: string): number {
    const config = this.ratioConfig[regionCode] ?? this.ratioConfig.default
    return params.b13_taux_effort < 35 ? config.ratio35.below35 : config.ratio35.above35
  }

  getRatio45(regionCode: string): number {
    const config = this.ratioConfig[regionCode] ?? this.ratioConfig.default
    return config.ratio45
  }
}
