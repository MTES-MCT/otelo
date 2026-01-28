import { Injectable } from '@nestjs/common'
import JSZip from 'jszip'
import { ChartGenerationService } from '~/export-powerpoint/chart-generation/chart-generation.service'
import { ZipService } from '~/export-powerpoint/zip/zip.service'
import { TPowerpointPlaceholders } from '~/schemas/export-powerpoint/export-powerpoint'

@Injectable()
export class PlaceholderGenerationService {
  constructor(
    private readonly chartGenerationService: ChartGenerationService,
    private readonly zipService: ZipService,
  ) {}

  async processSlide(slideXml: string, slideName: string, placeholders: TPowerpointPlaceholders, zip: JSZip): Promise<string> {
    let modifiedSlideXml = slideXml

    modifiedSlideXml = this.replaceTextPlaceholders(modifiedSlideXml, slideName, placeholders)
    modifiedSlideXml = await this.replaceChartPlaceholders(modifiedSlideXml, slideName, placeholders, zip)

    return modifiedSlideXml
  }

  private replaceTextPlaceholders(slideXml: string, slideName: string, placeholders: TPowerpointPlaceholders): string {
    let modifiedSlideXml = slideXml
    if (placeholders[slideName]?.text) {
      Object.entries(placeholders[slideName].text).forEach(([key, value]) => {
        const placeholder = `{{${key}}}`
        const regex = new RegExp(this.escapeXml(placeholder), 'g')
        modifiedSlideXml = modifiedSlideXml.replace(regex, this.escapeXml(value as string))
      })
    }

    return modifiedSlideXml
  }

  private async replaceChartPlaceholders(
    slideXml: string,
    slideName: string,
    placeholders: TPowerpointPlaceholders,
    zip: JSZip,
  ): Promise<string> {
    if (placeholders[slideName] && 'charts' in placeholders[slideName] && placeholders[slideName].charts) {
      for (const chartConfig of placeholders[slideName].charts) {
        const chartBuffer = await this.chartGenerationService.generateChartImage(chartConfig)

        if (chartConfig.templateImageFileName) {
          await this.zipService.replaceImageInTemplate(zip, chartBuffer, chartConfig.templateImageFileName)
        } else {
          console.warn(`No templateImageFileName specified for chart with placeholder: ${chartConfig.placeholder}`)
        }
      }
    }

    return slideXml
  }

  private escapeXml(text: string): string {
    return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;')
  }
}
