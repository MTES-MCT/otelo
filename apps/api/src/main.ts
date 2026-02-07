import { Logger } from '@nestjs/common'
import { NestFactory } from '@nestjs/core'
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger'
import { MainModule } from '~/main.module'

const bootstrap = async () => {
  const app = await NestFactory.create(MainModule, { bodyParser: false })
  const globalPrefix = 'api'

  const config = new DocumentBuilder()
    .setTitle('Otelo v4 - Open API')
    .setDescription('Here you can find the Open API documentation for Otelo v4')
    .setVersion('1.0')
    .addTag('Otelo v4')
    .build()

  const documentFactory = () => SwaggerModule.createDocument(app, config)
  SwaggerModule.setup('swagger', app, documentFactory, {
    useGlobalPrefix: true,
  })

  app.enableCors({
    origin: process.env.CLIENT_BASE_URL || 'http://localhost:3000',
    credentials: true,
  })

  app.setGlobalPrefix(globalPrefix)
  const port = process.env.PORT || 3000
  await app.listen(port)

  Logger.log(`🚀 Application is running on: http://localhost:${port}/${globalPrefix}`)
}
bootstrap()
