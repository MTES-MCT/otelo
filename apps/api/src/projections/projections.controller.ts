import { Controller, Get, HttpCode, HttpStatus, Query } from '@nestjs/common'
import { AccessControl } from '~/common/decorators/control-access.decorator'
import { Role } from '~/generated/prisma/enums'
import {
  type TProjectionSeriesByZone,
  type TProjectionZoneWithMillesime,
  type TResolvedProjectionZones,
} from '~/schemas/projections/projections'
import { ProjectionZonesService } from './projection-zones.service'
import {
  ProjectionByAgeGroupQueryDto,
  ProjectionByAgeQueryDto,
  ProjectionByHouseholdTypeQueryDto,
  ProjectionBySexQueryDto,
  ProjectionSeriesQueryDto,
  ProjectionZonesQueryDto,
  ResolveProjectionZonesQueryDto,
} from './projections.dto'
import { ProjectionsService } from './projections.service'

/**
 * Projections démographiques détaillées Omphale, aux niveaux EPCI et bassin d'habitat.
 *
 * Les codes de zone des deux niveaux étant disjoints, le niveau est implicite dans `zoneCodes` ;
 * `level` sert de garde-fou explicite. Un appelant qui part d'un code EPCI passe par
 * `zones/resolve`, seul endroit qui sache si le territoire a une projection propre ou seulement
 * celle de son bassin.
 */
@Controller('projections')
export class ProjectionsController {
  constructor(
    private readonly projectionsService: ProjectionsService,
    private readonly projectionZonesService: ProjectionZonesService,
  ) {}

  @AccessControl({ roles: [Role.ADMIN, Role.USER] })
  @Get('/zones')
  @HttpCode(HttpStatus.OK)
  async getZones(@Query() query: ProjectionZonesQueryDto): Promise<TProjectionZoneWithMillesime[]> {
    return this.projectionZonesService.find(query)
  }

  @AccessControl({ roles: [Role.ADMIN, Role.USER] })
  @Get('/zones/resolve')
  @HttpCode(HttpStatus.OK)
  async resolveZones(@Query() query: ResolveProjectionZonesQueryDto): Promise<TResolvedProjectionZones[]> {
    return this.projectionZonesService.resolveForEpcis(query.epciCodes, query.millesime)
  }

  @AccessControl({ roles: [Role.ADMIN, Role.USER] })
  @Get('/population')
  @HttpCode(HttpStatus.OK)
  async getPopulation(@Query() query: ProjectionSeriesQueryDto): Promise<TProjectionSeriesByZone> {
    return this.projectionsService.getPopulation(query)
  }

  @AccessControl({ roles: [Role.ADMIN, Role.USER] })
  @Get('/population/by-sex')
  @HttpCode(HttpStatus.OK)
  async getPopulationBySex(@Query() query: ProjectionBySexQueryDto): Promise<TProjectionSeriesByZone> {
    return this.projectionsService.getPopulationBySex(query)
  }

  @AccessControl({ roles: [Role.ADMIN, Role.USER] })
  @Get('/population/by-age')
  @HttpCode(HttpStatus.OK)
  async getPopulationByAge(@Query() query: ProjectionByAgeQueryDto): Promise<TProjectionSeriesByZone> {
    return this.projectionsService.getPopulationByAge(query)
  }

  @AccessControl({ roles: [Role.ADMIN, Role.USER] })
  @Get('/population/by-age-group')
  @HttpCode(HttpStatus.OK)
  async getPopulationByAgeGroup(@Query() query: ProjectionByAgeGroupQueryDto): Promise<TProjectionSeriesByZone> {
    return this.projectionsService.getPopulationByAgeGroup(query)
  }

  @AccessControl({ roles: [Role.ADMIN, Role.USER] })
  @Get('/households')
  @HttpCode(HttpStatus.OK)
  async getHouseholds(@Query() query: ProjectionSeriesQueryDto): Promise<TProjectionSeriesByZone> {
    return this.projectionsService.getHouseholds(query)
  }

  @AccessControl({ roles: [Role.ADMIN, Role.USER] })
  @Get('/households/by-type')
  @HttpCode(HttpStatus.OK)
  async getHouseholdsByType(@Query() query: ProjectionByHouseholdTypeQueryDto): Promise<TProjectionSeriesByZone> {
    return this.projectionsService.getHouseholdsByType(query)
  }
}
