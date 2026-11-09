import { createMock } from '@golevelup/ts-jest'
import { NotFoundException } from '@nestjs/common'
import { Test } from '@nestjs/testing'
import { DataPackVersionsService } from '~/data-pack-versions/data-pack-versions.service'
import { PrismaService } from '~/db/prisma.service'
import { DemographicEvolutionService } from '~/demographic-evolution/demographic-evolution.service'
import { AmfService } from './amf.service'

describe('AmfService.getEpci', () => {
  const code = '200000172'
  let service: AmfService
  let prisma: jest.Mocked<PrismaService>
  let demographic: jest.Mocked<DemographicEvolutionService>

  const mockProjection = (base: object, horizon: object) => {
    demographic.getDemographicEvolutionPopulationByEpci.mockResolvedValue({
      [code]: {
        data: [
          { year: 2022, ...base },
          { year: 2036, ...horizon },
        ],
        metadata: {},
      },
      all: { data: [], metadata: {} },
    } as never)
  }

  beforeEach(async () => {
    prisma = createMock<PrismaService>()
    demographic = createMock<DemographicEvolutionService>()
    const dataPacks = createMock<DataPackVersionsService>()
    dataPacks.getActive.mockResolvedValue({ millesime: '2022' } as never)
    ;(prisma.epci.findUnique as jest.Mock).mockResolvedValue({ code, name: 'CA Test', noInseeProjection: false })

    const module = await Test.createTestingModule({
      providers: [
        AmfService,
        { provide: PrismaService, useValue: prisma },
        { provide: DataPackVersionsService, useValue: dataPacks },
        { provide: DemographicEvolutionService, useValue: demographic },
      ],
    }).compile()
    service = module.get(AmfService)
  })

  it('renvoie les évolutions en habitants arrondies entre base et 2036', async () => {
    mockProjection({ central: 448444, haute: 448444, basse: 448444 }, { central: 457117, haute: 473584, basse: 441290 })
    const result = await service.getEpci(code)
    expect(demographic.getDemographicEvolutionPopulationByEpci).toHaveBeenCalledWith(code, '2022', [2022, 2036])
    expect(result).toEqual({
      code,
      name: 'CA Test',
      fragileProjection: false,
      baseYear: 2022,
      horizon: 2036,
      populationChanges: { haute: 25140, central: 8670, basse: -7150 },
    })
  })

  it('renvoie basse null quand la projection basse manque', async () => {
    mockProjection({ central: 448444, haute: 448444, basse: null }, { central: 457117, haute: 473584, basse: null })
    const result = await service.getEpci(code)
    expect(result.populationChanges.basse).toBeNull()
  })

  it('signale une projection fragile', async () => {
    ;(prisma.epci.findUnique as jest.Mock).mockResolvedValue({ code, name: 'CA Test', noInseeProjection: true })
    mockProjection({ central: 100, haute: 100, basse: 100 }, { central: 200, haute: 200, basse: 200 })
    const result = await service.getEpci(code)
    expect(result.fragileProjection).toBe(true)
  })

  it('lève NotFoundException pour un EPCI inconnu', async () => {
    ;(prisma.epci.findUnique as jest.Mock).mockResolvedValue(null)
    await expect(service.getEpci('999999999')).rejects.toThrow(NotFoundException)
  })
})
