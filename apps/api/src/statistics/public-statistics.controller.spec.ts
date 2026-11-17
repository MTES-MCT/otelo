import 'reflect-metadata'
import { createMock } from '@golevelup/ts-jest'
import { TPublicStatistics } from '~/schemas/statistics/public-statistics'
import { PublicStatisticsController } from './public-statistics.controller'
import { PublicStatisticsService } from './public-statistics.service'

jest.mock('@thallesp/nestjs-better-auth', () => ({
  AllowAnonymous: () => (target: object, key?: string | symbol) => {
    // Reproduit `SetMetadata('PUBLIC', true)` : c'est cette marque que le test cherche.
    Reflect.defineMetadata('PUBLIC', true, key ? (target as Record<string | symbol, object>)[key] : target)
  },
}))

describe('PublicStatisticsController', () => {
  it('délègue au service et renvoie son résultat', async () => {
    const service = createMock<PublicStatisticsService>()
    const result = { generatedAt: 'x' } as unknown as TPublicStatistics
    service.getPublicStatistics.mockResolvedValue(result)

    const controller = new PublicStatisticsController(service)

    await expect(controller.getPublicStatistics()).resolves.toBe(result)
    expect(service.getPublicStatistics).toHaveBeenCalledTimes(1)
  })

  it('est déclarée anonyme', () => {
    expect(Reflect.getMetadata('PUBLIC', PublicStatisticsController.prototype.getPublicStatistics)).toBe(true)
  })
})
