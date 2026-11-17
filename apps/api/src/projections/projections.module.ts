import { Module } from '@nestjs/common'
import { DataPackVersionsModule } from '~/data-pack-versions/data-pack-versions.module'
import { PrismaModule } from '~/db/prisma.module'
import { AgePyramidService } from './age-pyramid.service'
import { ProjectionZonesService } from './projection-zones.service'
import { ProjectionsController } from './projections.controller'
import { ProjectionsService } from './projections.service'

@Module({
  controllers: [ProjectionsController],
  exports: [ProjectionsService, ProjectionZonesService, AgePyramidService],
  imports: [PrismaModule, DataPackVersionsModule],
  providers: [ProjectionsService, ProjectionZonesService, AgePyramidService],
})
export class ProjectionsModule {}
