import { createMock, type DeepMocked } from '@golevelup/ts-jest'
import { BadRequestException, ForbiddenException } from '@nestjs/common'
import { PrismaService } from '~/db/prisma.service'
import { Prisma } from '~/generated/prisma/client'
import { DemographicEvolutionCustomService } from './demographic-evolution-custom.service'

describe('DemographicEvolutionCustomService.parseUploadedFile', () => {
  const service = new DemographicEvolutionCustomService({} as PrismaService)

  const toBuffer = (lines: string[]) => Buffer.from(lines.join('\n'), 'utf-8')

  it('should sum values using a comma as decimal separator', async () => {
    const buffer = toBuffer(['ZONE;SEXE;AGE;MENAGES_2018;MENAGES_2030', 'Z1;H;20;12,5;1 000,25', 'Z1;F;20;7,5;0,75'])

    await expect(service.parseUploadedFile(buffer, 'text/csv')).resolves.toEqual([
      { value: 20, year: 2018 },
      { value: 1001, year: 2030 },
    ])
  })

  it('should still sum values using a dot as decimal separator', async () => {
    const buffer = toBuffer(['ZONE;SEXE;AGE;MENAGES_2018', 'Z1;H;20;12.5', 'Z1;F;20;7'])

    await expect(service.parseUploadedFile(buffer, 'text/csv')).resolves.toEqual([{ value: 19.5, year: 2018 }])
  })

  it('should ignore empty cells', async () => {
    const buffer = toBuffer(['ZONE;SEXE;AGE;MENAGES_2018', 'Z1;H;20;', 'Z1;F;20;3,5'])

    await expect(service.parseUploadedFile(buffer, 'text/csv')).resolves.toEqual([{ value: 3.5, year: 2018 }])
  })

  it('should reject a non numeric value with its column and line', async () => {
    const buffer = toBuffer(['ZONE;SEXE;AGE;MENAGES_2018', 'Z1;H;20;12,5', 'Z1;F;20;abc'])

    const result = service.parseUploadedFile(buffer, 'text/csv')

    await expect(result).rejects.toThrow(BadRequestException)
    await expect(result).rejects.toThrow('Valeur invalide "abc" dans MENAGES_2018, ligne 3')
  })
})

describe('DemographicEvolutionCustomService.findAndRecalibrate', () => {
  it('should recalibrate on the INSEE reference of the requested millesime only', async () => {
    const queryRaw = jest.fn().mockResolvedValue([])
    const service = new DemographicEvolutionCustomService({ $queryRaw: queryRaw } as unknown as PrismaService)

    await service.findAndRecalibrate(Prisma.empty, 2022)

    const [strings, ...values] = queryRaw.mock.calls[0]
    const sql = Prisma.sql(strings, ...values)
    expect(sql.text).toMatch(/deo\.year = \$\d+ AND deo\.millesime = \$\d+/)
    expect(sql.values).toEqual(expect.arrayContaining([2022, '2022']))
  })
})


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
