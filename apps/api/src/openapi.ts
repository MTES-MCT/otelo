import { INestApplication } from '@nestjs/common'
import { DocumentBuilder, OpenAPIObject, SwaggerModule } from '@nestjs/swagger'
import { cleanupOpenApiDoc } from 'nestjs-zod'
import { ExternalModule } from '~/external/external.module'

const bearerAuth = {
  type: 'http' as const,
  scheme: 'bearer',
  description: 'API Key au format otelo_xxx',
}

/**
 * Swagger : les routes d'administration en sont absentes, via `@ExcludeOpenApi()`. Le
 * document est servi hors pipeline Nest, donc sans garde : c'est son contenu, et non
 * son accès, qui le rend publiable.
 */
export function createInternalDocument(app: INestApplication): OpenAPIObject {
  const config = new DocumentBuilder()
    .setTitle('Otelo - API interne')
    .setDescription("Documentation de l'API Otelo. Les routes d'administration en sont exclues.")
    .setVersion('1.0')
    .addBearerAuth(bearerAuth)
    .build()

  return cleanupOpenApiDoc(SwaggerModule.createDocument(app, config))
}

export function createExternalDocument(app: INestApplication): OpenAPIObject {
  const config = new DocumentBuilder()
    .setTitle('Otelo - API externe')
    .setDescription(
      'API Otelo pour les consommateurs externes.\n\n' +
        'Authentification : `Authorization: Bearer otelo_xxx`\n\n' +
        'Contactez un administrateur pour obtenir une clé API par mail : otelo@beta.gouv.fr',
    )
    .setVersion('1.0')
    .addBearerAuth(bearerAuth)
    .build()

  return cleanupOpenApiDoc(SwaggerModule.createDocument(app, config, { include: [ExternalModule] }))
}
