import { createMock } from '@golevelup/ts-jest'
import { ForbiddenException } from '@nestjs/common'
import { NeedsCalculationService } from '~/calculation/needs-calculation/needs-calculation.service'
import { PrismaService } from '~/db/prisma.service'
import { SimulationsService } from '~/simulations/simulations.service'
import { PreviewService } from './preview.service'

/**
 * La simulation est désignée par le corps, pas par l'URL : `@AccessControl` ne peut pas
 * vérifier la propriété, faute de paramètre à lire. Le contrôle en code est la seule
 * chose qui empêche de faire calculer les résultats d'une simulation d'autrui.
 */
describe('PreviewService', () => {
  let service: PreviewService
  let simulationsService: jest.Mocked<SimulationsService>
  let needsCalculationService: jest.Mocked<NeedsCalculationService>

  beforeEach(() => {
    simulationsService = createMock<SimulationsService>()
    needsCalculationService = createMock<NeedsCalculationService>()
    service = new PreviewService(createMock<PrismaService>(), simulationsService, needsCalculationService)
  })

  it('should refuse to preview a simulation the caller does not own', async () => {
    simulationsService.hasUserAccessTo.mockResolvedValue(false)

    await expect(service.calculate({ simulationId: 'sim-a-quelquun-dautre' }, 'user-1')).rejects.toBeInstanceOf(ForbiddenException)

    expect(simulationsService.get).not.toHaveBeenCalled()
    expect(needsCalculationService.calculate).not.toHaveBeenCalled()
  })

  it('should check ownership before reading the simulation', async () => {
    simulationsService.hasUserAccessTo.mockResolvedValue(false)

    await service.calculate({ simulationId: 'sim-1' }, 'user-1').catch(() => undefined)

    expect(simulationsService.hasUserAccessTo).toHaveBeenCalledWith('sim-1', 'user-1')
  })

  /** Une simulation non enregistrée n'appartient à personne. */
  it('should not require ownership when no simulation is referenced', async () => {
    await service.calculate({ epcis: [] }, 'user-1').catch(() => undefined)

    expect(simulationsService.hasUserAccessTo).not.toHaveBeenCalled()
  })
})
