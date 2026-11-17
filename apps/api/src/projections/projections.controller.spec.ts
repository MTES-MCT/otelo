import { createMock, type DeepMocked } from '@golevelup/ts-jest'
import { Test, type TestingModule } from '@nestjs/testing'
import { ProjectionZonesService } from './projection-zones.service'
import { ProjectionsController } from './projections.controller'
import { ProjectionsService } from './projections.service'

describe('ProjectionsController', () => {
  let controller: ProjectionsController
  let projectionsService: DeepMocked<ProjectionsService>
  let zonesService: DeepMocked<ProjectionZonesService>

  beforeEach(async () => {
    projectionsService = createMock<ProjectionsService>()
    zonesService = createMock<ProjectionZonesService>()

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProjectionsController],
      providers: [
        { provide: ProjectionsService, useValue: projectionsService },
        { provide: ProjectionZonesService, useValue: zonesService },
      ],
    }).compile()

    controller = module.get(ProjectionsController)
  })

  it('should be defined', () => {
    expect(controller).toBeDefined()
  })

  it('délègue le référentiel de zones', async () => {
    await controller.getZones({ level: 'BH' } as never)
    expect(zonesService.find).toHaveBeenCalledWith({ level: 'BH' })
  })

  it('délègue la résolution par EPCI en séparant codes et millésime', async () => {
    await controller.resolveZones({ epciCodes: ['200006682'], millesime: '2022' } as never)
    expect(zonesService.resolveForEpcis).toHaveBeenCalledWith(['200006682'], '2022')
  })

  it('délègue chaque série à sa méthode de service', async () => {
    const query = { zoneCodes: ['200006682'], fromYear: 2018, toYear: 2050 } as never

    await controller.getPopulation(query)
    await controller.getPopulationBySex(query)
    await controller.getPopulationByAge(query)
    await controller.getPopulationByAgeGroup(query)
    await controller.getHouseholds(query)
    await controller.getHouseholdsByType(query)

    expect(projectionsService.getPopulation).toHaveBeenCalledWith(query)
    expect(projectionsService.getPopulationBySex).toHaveBeenCalledWith(query)
    expect(projectionsService.getPopulationByAge).toHaveBeenCalledWith(query)
    expect(projectionsService.getPopulationByAgeGroup).toHaveBeenCalledWith(query)
    expect(projectionsService.getHouseholds).toHaveBeenCalledWith(query)
    expect(projectionsService.getHouseholdsByType).toHaveBeenCalledWith(query)
  })
})
