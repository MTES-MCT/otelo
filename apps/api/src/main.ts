import { Logger } from '@nestjs/common'
import { NestFactory } from '@nestjs/core'
import { NestExpressApplication } from '@nestjs/platform-express'
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger'
import helmet from 'helmet'
import { cleanupOpenApiDoc } from 'nestjs-zod'
import { ExternalModule } from '~/external/external.module'
import { MainModule } from '~/main.module'

const bootstrap = async () => {
  const app = await NestFactory.create<NestExpressApplication>(MainModule, { bodyParser: false })
  const globalPrefix = 'api'

  /**
   * Fait confiance au dernier intermédiaire (le routeur de la plateforme) pour
   * déterminer l'IP appelante.
   *
   * Sans cela, `req.ip` vaut l'adresse du proxy et non celle du visiteur : tous les
   * appels partagent alors un unique compteur de débit, et les plafonds se retournent
   * contre les utilisateurs légitimes — trois envois du formulaire de contact, quels
   * qu'en soient les auteurs, bloqueraient le formulaire pour tout le monde.
   *
   * La valeur `1` plutôt que `true` est délibérée : elle ne retient que le saut ajouté
   * par le proxy, seule partie de `X-Forwarded-For` qu'un client ne peut pas falsifier.
   */
  app.set('trust proxy', 1)

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

  /**
   * En-têtes de sécurité HTTP.
   *
   * L'API ne rend pas de pages : la CSP y a peu d'effet, sauf pour Swagger, servi par
   * cette même application. Les valeurs par défaut de Helmet bloquent ses styles et son
   * script embarqués, d'où une politique explicite qui les autorise et rien d'autre.
   *
   * `crossOriginResourcePolicy` est desserré à `cross-origin` : le site est sur un autre
   * domaine que l'API, et la valeur par défaut (`same-origin`) bloquerait le
   * téléchargement des exports Excel et PowerPoint.
   */
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'", "'unsafe-inline'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          imgSrc: ["'self'", 'data:', 'https:'],
          fontSrc: ["'self'", 'data:'],
          objectSrc: ["'none'"],
          frameAncestors: ["'none'"],
          baseUri: ["'self'"],
          formAction: ["'self'"],
        },
      },
      crossOriginResourcePolicy: { policy: 'cross-origin' },
      // 6 mois, sous-domaines inclus. `preload` volontairement omis : l'inscription à la
      // liste des navigateurs est difficile à défaire et engage tous les sous-domaines.
      hsts: {
        maxAge: 15_552_000,
        includeSubDomains: true,
      },
    }),
  )

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
