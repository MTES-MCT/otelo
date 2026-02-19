import { Logger } from '@nestjs/common'
import { NestFactory } from '@nestjs/core'
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger'
import { cleanupOpenApiDoc } from 'nestjs-zod'
import { ExternalModule } from '~/external/external.module'
import { MainModule } from '~/main.module'

const bootstrap = async () => {
  const app = await NestFactory.create(MainModule, { bodyParser: false })
  const globalPrefix = 'api'

  // Swagger complet (tous les endpoints)
  const fullConfig = new DocumentBuilder()
    .setTitle('Otelo - API interne')
    .setDescription("Documentation complete de l'API Otelo (endpoints internes + externes).")
    .setVersion('1.0')
    .addBearerAuth({
      type: 'http',
      scheme: 'bearer',
      description: 'API Key au format otelo_xxx',
    })
    .build()

  const fullDocumentFactory = () => cleanupOpenApiDoc(SwaggerModule.createDocument(app, fullConfig))
  SwaggerModule.setup('swagger', app, fullDocumentFactory, {
    useGlobalPrefix: true,
  })

  const externalConfig = new DocumentBuilder()
    .setTitle('Otelo - API externe')
    .setDescription(
      'API Otelo pour les consommateurs externes.\n\n' +
        'Authentification : `Authorization: Bearer otelo_xxx`\n\n' +
        'Contactez un administrateur pour obtenir une clé API par mail : otelo@beta.gouv.fr',
    )
    .setVersion('1.0')
    .addBearerAuth({
      type: 'http',
      scheme: 'bearer',
      description: 'API Key au format otelo_xxx',
    })
    .build()

  const externalDocumentFactory = () =>
    cleanupOpenApiDoc(
      SwaggerModule.createDocument(app, externalConfig, {
        include: [ExternalModule],
      }),
    )
  SwaggerModule.setup('swagger-external', app, externalDocumentFactory, {
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
