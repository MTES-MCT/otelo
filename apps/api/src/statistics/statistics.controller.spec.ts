import { createMock } from '@golevelup/ts-jest'
import { ForbiddenException } from '@nestjs/common'
import { TUser } from '~/schemas/users/user'
import { AudienceStatisticsService } from './audience-statistics.service'
import { StatisticsController } from './statistics.controller'
import { StatisticsService } from './statistics.service'

describe('StatisticsController — portée du pilotage', () => {
  let controller: StatisticsController
  let statisticsService: jest.Mocked<StatisticsService>

  const user = (overrides: Partial<TUser>): TUser =>
    ({ id: 'user-1', role: 'USER', hasAccess: true, type: null, region: null, ...overrides }) as TUser

  beforeEach(() => {
    statisticsService = createMock<StatisticsService>()
    statisticsService.getPilotageData.mockResolvedValue({} as never)
    controller = new StatisticsController(statisticsService, createMock<AudienceStatisticsService>())
  })

  it('should refuse a self-declared DREAL with no region assigned', async () => {
    await expect(controller.getPilotageData(user({ type: 'DREAL' }))).rejects.toBeInstanceOf(ForbiddenException)

    expect(statisticsService.getPilotageData).not.toHaveBeenCalled()
  })

  it('should never fall back to a nationwide scope for a DREAL', async () => {
    await controller.getPilotageData(user({ type: 'DREAL', region: '27' })).catch(() => undefined)

    expect(statisticsService.getPilotageData).toHaveBeenCalledWith('27', undefined)
  })

  it('should keep a DREAL inside their own region, whatever they ask for', async () => {
    await controller.getPilotageData(user({ type: 'DREAL', region: '27' }), '11')

    expect(statisticsService.getPilotageData).toHaveBeenCalledWith('27', undefined)
  })

  it('should let an admin choose the region, including none', async () => {
    await controller.getPilotageData(user({ role: 'ADMIN' }), '11')
    expect(statisticsService.getPilotageData).toHaveBeenCalledWith('11', undefined)

    await controller.getPilotageData(user({ role: 'ADMIN' }))
    expect(statisticsService.getPilotageData).toHaveBeenLastCalledWith(undefined, undefined)
  })

  it('should treat an admin as an admin even if their type says DREAL', async () => {
    await controller.getPilotageData(user({ role: 'ADMIN', type: 'DREAL', region: null }), '11')

    expect(statisticsService.getPilotageData).toHaveBeenCalledWith('11', undefined)
  })
})
