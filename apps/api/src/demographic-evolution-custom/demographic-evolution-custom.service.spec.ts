import { createMock, type DeepMocked } from '@golevelup/ts-jest'
import { ForbiddenException } from '@nestjs/common'
import { PrismaService } from '~/db/prisma.service'
import { DemographicEvolutionCustomService } from './demographic-evolution-custom.service'

/**
 * L'EPCI et le scénario viennent du corps : aucun décorateur ne peut en vérifier la
 * propriété. Le calcul lit cette donnée par (scénario, EPCI).
 */
describe('DemographicEvolutionCustomService.upsert', () => {
  let service: DemographicEvolutionCustomService
  let prisma: DeepMocked<PrismaService>

  const payload = { data: [] as never, epciCode: '200069672', scenarioId: undefined }

  beforeEach(() => {
    prisma = createMock<PrismaService>()
    service = new DemographicEvolutionCustomService(prisma)
  })

  it('should refuse to attach a projection to someone else’s scenario', async () => {
    prisma.scenario.findFirst = jest.fn().mockResolvedValue(null)

    await expect(service.upsert('user-1', { ...payload, scenarioId: 'scenario-victime' })).rejects.toBeInstanceOf(ForbiddenException)

    expect(prisma.demographicEvolutionOmphaleCustom.create).not.toHaveBeenCalled()
    expect(prisma.demographicEvolutionOmphaleCustom.update).not.toHaveBeenCalled()
  })

  it('should accept a scenario the caller owns', async () => {
    prisma.scenario.findFirst = jest.fn().mockResolvedValue({ id: 'scenario-a-moi' })
    prisma.demographicEvolutionOmphaleCustom.findFirst = jest.fn().mockResolvedValue(null)
    prisma.demographicEvolutionOmphaleCustom.create = jest.fn().mockResolvedValue({ id: 'dec-1' })

    await service.upsert('user-1', { ...payload, scenarioId: 'scenario-a-moi' })

    expect(prisma.scenario.findFirst).toHaveBeenCalledWith({ where: { id: 'scenario-a-moi', userId: 'user-1' }, select: { id: true } })
    expect(prisma.demographicEvolutionOmphaleCustom.create).toHaveBeenCalled()
  })

  /** Un code EPCI est une donnée publique : sans filtre, la recherche tombe sur la ligne d'autrui. */
  it('should look for an existing row only among the caller’s own', async () => {
    prisma.demographicEvolutionOmphaleCustom.findFirst = jest.fn().mockResolvedValue(null)
    prisma.demographicEvolutionOmphaleCustom.create = jest.fn().mockResolvedValue({ id: 'dec-1' })

    await service.upsert('user-1', payload)

    expect(prisma.demographicEvolutionOmphaleCustom.findFirst).toHaveBeenCalledWith({
      where: { epciCode: '200069672', scenarioId: null, userId: 'user-1' },
    })
  })

  it('should not check any scenario when none is referenced', async () => {
    prisma.demographicEvolutionOmphaleCustom.findFirst = jest.fn().mockResolvedValue(null)
    prisma.demographicEvolutionOmphaleCustom.create = jest.fn().mockResolvedValue({ id: 'dec-1' })

    await service.upsert('user-1', payload)

    expect(prisma.scenario.findFirst).not.toHaveBeenCalled()
  })
})
