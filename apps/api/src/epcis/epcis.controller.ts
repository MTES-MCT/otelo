import { Body, Controller, Delete, Get, HttpCode, HttpStatus, NotFoundException, Param, Post, Put, Query } from '@nestjs/common'
import { TEpci } from '@shared'
import { AccessControl } from '~/common/decorators/control-access.decorator'
import { EpcisService } from '~/epcis/epcis.service'
import { Epci } from '~/generated/prisma/client'
import { Role } from '~/generated/prisma/enums'
import { TEpciContour } from '~/schemas/epcis/epci-contour'

@Controller('epcis')
export class EpcisController {
  constructor(private readonly epcisService: EpcisService) {}

  @AccessControl({
    roles: [Role.ADMIN, Role.USER],
  })
  @Get()
  @HttpCode(HttpStatus.OK)
  async getEpcis(@Query('epcis') epcis: string, @Query('baseEpci') baseEpci?: string): Promise<Epci[]> {
    try {
      return await this.epcisService.getList(epcis, baseEpci)
    } catch (error) {
      throw new NotFoundException(`EPCI with code ${epcis} not found`, { cause: error })
    }
  }

  /** Contours des EPCI, pour la carte de la page de résultats. */
  @AccessControl({
    roles: [Role.ADMIN, Role.USER],
  })
  @Get('contours')
  @HttpCode(HttpStatus.OK)
  async getContours(@Query('codes') codes: string): Promise<TEpciContour[]> {
    const epciCodes = codes?.split(',').filter(Boolean) ?? []
    if (epciCodes.length === 0) {
      return []
    }
    return this.epcisService.getContours(epciCodes)
  }

  @Get('contiguous')
  @AccessControl({
    roles: [Role.ADMIN, Role.USER],
  })
  async getContiguousEpcis(@Query('codes') codes: string): Promise<Epci[]> {
    const epciCodes = codes.split(',')
    return this.epcisService.getContiguousEpcis(epciCodes)
  }

  @AccessControl({
    roles: [Role.ADMIN, Role.USER],
  })
  @Get(':code')
  @HttpCode(HttpStatus.OK)
  async getEpci(@Param('code') code: string): Promise<Epci> {
    try {
      return await this.epcisService.get(code)
    } catch (error) {
      throw new NotFoundException(`EPCI with code ${code} not found`, { cause: error })
    }
  }

  @AccessControl({
    roles: [Role.ADMIN],
  })
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createEpci(@Body() data: TEpci): Promise<Epci> {
    return await this.epcisService.create(data)
  }

  @AccessControl({
    paramName: 'code',
    roles: [Role.ADMIN],
  })
  @Put(':code')
  @HttpCode(HttpStatus.ACCEPTED)
  async updateEpci(@Param('code') code: string, @Body() data: Partial<Epci>): Promise<Epci> {
    try {
      return await this.epcisService.put(code, data)
    } catch (error) {
      throw new NotFoundException(`EPCI with code ${code} not found`, { cause: error })
    }
  }

  @AccessControl({
    paramName: 'code',
    roles: [Role.ADMIN],
  })
  @Delete(':code')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteEpci(@Param('code') code: string): Promise<void> {
    try {
      await this.epcisService.delete(code)
    } catch (error) {
      throw new NotFoundException(`EPCI with code ${code} not found`, { cause: error })
    }
  }

  @AccessControl({
    paramName: 'epciCode',
    roles: [Role.ADMIN, Role.USER],
  })
  @Get(':epciCode/bassin')
  @HttpCode(HttpStatus.OK)
  async getEpcisByBassin(@Param('epciCode') epciCode: string): Promise<Epci[]> {
    return this.epcisService.getBassinEpcisByEpciCode(epciCode)
  }
}
