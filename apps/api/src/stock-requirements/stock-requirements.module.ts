import { Module } from '@nestjs/common'
import { StockRequirementsService } from './stock-requirements.service'

@Module({
  providers: [StockRequirementsService],
  exports: [StockRequirementsService],
})
export class StockRequirementsModule {}
