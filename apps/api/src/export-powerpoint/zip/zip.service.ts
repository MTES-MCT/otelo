import { Injectable } from '@nestjs/common'
import * as fs from 'fs'
import JSZip from 'jszip'
import * as path from 'path'

@Injectable()
export class ZipService {
  private readonly templatePath = path.join(process.cwd(), 'public', 'ppt', 'template.pptx')

  async unzipPptx(): Promise<JSZip> {
    const pptxBuffer = fs.readFileSync(this.templatePath)
    const zip = new JSZip()
    return await zip.loadAsync(pptxBuffer)
  }

  async generatePptx(zip: JSZip): Promise<Buffer> {
    return await zip.generateAsync({ type: 'nodebuffer' })
  }

  async replaceImageInTemplate(zip: JSZip, imageBuffer: Buffer, imageFileName: string): Promise<void> {
    const mediaPath = `ppt/media/${imageFileName}`

    const existingImage = zip.file(mediaPath)
    if (existingImage) {
      zip.file(mediaPath, imageBuffer)
    } else {
      throw new Error(`Image ${imageFileName} not found in template`)
    }
  }

  async findImageFilesInTemplate(zip: JSZip): Promise<string[]> {
    return Object.keys(zip.files)
      .filter((name) => name.match(/^ppt\/media\/.*\.(png|jpg|jpeg)$/i))
      .map((path) => path.split('/').pop()!)
  }
}
