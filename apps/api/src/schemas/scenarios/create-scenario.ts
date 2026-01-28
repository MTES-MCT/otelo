import { z } from 'zod'
import { ZScenario } from '~/schemas/scenarios/scenario'

export const ZCreateScenario = ZScenario.omit({
  id: true,
})

export type TCreateScenario = z.infer<typeof ZCreateScenario>
