import { Module } from '@nestjs/common'
import { ZipService } from './zip.service'

@Module({
  providers: [ZipService],
  exports: [ZipService],
})
export class ZipModule {}
