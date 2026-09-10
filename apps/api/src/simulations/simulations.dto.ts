import { createZodDto } from 'nestjs-zod'
import { ZUpdateSimulationDto } from '~/schemas/scenarios/scenario'
import { ZInitSimulation } from '~/schemas/simulations/create-simulation'
import { ZActualizeSimulationDto, ZCloneSimulationDto, ZRenameSimulationDto } from '~/schemas/simulations/simulation'

export class InitSimulationDto extends createZodDto(ZInitSimulation) {}
export class UpdateSimulationDto extends createZodDto(ZUpdateSimulationDto) {}
export class RenameSimulationDto extends createZodDto(ZRenameSimulationDto) {}
export class CloneSimulationDto extends createZodDto(ZCloneSimulationDto) {}
export class ActualizeSimulationDto extends createZodDto(ZActualizeSimulationDto) {}
