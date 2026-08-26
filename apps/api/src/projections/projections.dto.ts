import { createZodDto } from 'nestjs-zod'
import {
  ZProjectionByAgeGroupQuery,
  ZProjectionByAgeQuery,
  ZProjectionByHouseholdTypeQuery,
  ZProjectionBySexQuery,
  ZProjectionSeriesQuery,
  ZProjectionZonesQuery,
  ZResolveProjectionZonesQuery,
} from '~/schemas/projections/projections'

/**
 * Les paramètres de requête passent par `createZodDto`, et non par une simple annotation de type.
 *
 * Le `ZodValidationPipe` global se déclenche sur le *metatype* du paramètre : un type TypeScript
 * est effacé à la compilation, si bien qu'annoter `@Query()` avec un `z.infer<...>` ne valide
 * rien à l'exécution — c'est le cas aujourd'hui de `demographic-evolution.controller.ts`. Une
 * classe issue de `createZodDto` survit à la compilation : la validation s'applique réellement, et
 * Swagger documente les paramètres au passage.
 */
export class ProjectionZonesQueryDto extends createZodDto(ZProjectionZonesQuery) {}
export class ResolveProjectionZonesQueryDto extends createZodDto(ZResolveProjectionZonesQuery) {}
export class ProjectionSeriesQueryDto extends createZodDto(ZProjectionSeriesQuery) {}
export class ProjectionBySexQueryDto extends createZodDto(ZProjectionBySexQuery) {}
export class ProjectionByAgeQueryDto extends createZodDto(ZProjectionByAgeQuery) {}
export class ProjectionByAgeGroupQueryDto extends createZodDto(ZProjectionByAgeGroupQuery) {}
export class ProjectionByHouseholdTypeQueryDto extends createZodDto(ZProjectionByHouseholdTypeQuery) {}
