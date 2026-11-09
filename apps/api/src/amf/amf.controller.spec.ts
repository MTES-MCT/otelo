import { createMock } from '@golevelup/ts-jest'
import { Test, TestingModule } from '@nestjs/testing'
import { PrismaService } from '~/db/prisma.service'
import { ApiConsumer } from '~/generated/prisma/client'
import { AmfController } from './amf.controller'
import { TAmfCreateSimulationBody } from './amf.schemas'
import { AmfService } from './amf.service'

jest.mock('@thallesp/nestjs-better-auth', () => ({
  // biome-ignore lint/suspicious/noEmptyBlockStatements: allow empty block
  AllowAnonymous: () => () => {},
}))

describe('AmfController', () => {
  let controller: AmfController
  let service: jest.Mocked<AmfService>

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AmfController],
      providers: [
        { provide: AmfService, useValue: createMock<AmfService>() },
        { provide: PrismaService, useValue: createMock<PrismaService>() },
      ],
    }).compile()

    controller = module.get(AmfController)
    service = module.get(AmfService)
  })

  it('délègue la lecture de l’EPCI au service', async () => {
    const epci = { code: '200000172' } as never
    service.getEpci.mockResolvedValue(epci)
    await expect(controller.getEpci('200000172')).resolves.toBe(epci)
    expect(service.getEpci).toHaveBeenCalledWith('200000172')
  })

  it('transmet l’identifiant du consommateur à la création', async () => {
    const body = { epciCode: '200000172', email: 'a@b.fr' } as TAmfCreateSimulationBody
    const response = { leadId: 'lead-1' } as never
    service.createSimulation.mockResolvedValue(response)
    await expect(controller.createSimulation({ id: 'consumer-1' } as ApiConsumer, body)).resolves.toBe(response)
    expect(service.createSimulation).toHaveBeenCalledWith('consumer-1', body)
  })

  it('délègue l’ajout des contacts au service', async () => {
    const body = { contacts: [{ role: 'Maire', email: 'a@b.fr' }] }
    service.addContacts.mockResolvedValue(undefined)
    await controller.addContacts('lead-1', body)
    expect(service.addContacts).toHaveBeenCalledWith('lead-1', body)
  })
})
