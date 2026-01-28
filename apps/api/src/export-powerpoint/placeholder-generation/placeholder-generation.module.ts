import { Module } from '@nestjs/common'
import { ChartGenerationModule } from '~/export-powerpoint/chart-generation/chart-generation.module'
import { ZipModule } from '~/export-powerpoint/zip/zip.module'
import { PlaceholderGenerationService } from './placeholder-generation.service'

@Module({
  providers: [PlaceholderGenerationService],
  exports: [PlaceholderGenerationService],
  imports: [ChartGenerationModule, ZipModule],
})
export class PlaceholderGenerationModule {}
