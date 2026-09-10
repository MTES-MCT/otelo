import { ApiExcludeController, ApiExcludeEndpoint } from '@nestjs/swagger'

/**
 * Retire de la documentation OpenAPI la route, ou le contrôleur entier.
 *
 * Toute route non ouverte au rôle `USER` doit le porter ; `route-access.spec.ts` échoue
 * sinon. Le Swagger est public : y publier la surface d'administration en donne la carte.
 */
export const ExcludeOpenApi = (): ClassDecorator & MethodDecorator =>
  ((target: object, propertyKey?: string | symbol, descriptor?: PropertyDescriptor) =>
    propertyKey && descriptor
      ? ApiExcludeEndpoint()(target, propertyKey, descriptor)
      : ApiExcludeController()(target as never)) as ClassDecorator & MethodDecorator
