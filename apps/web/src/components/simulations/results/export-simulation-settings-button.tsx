'use client'

import Button from '@codegouvfr/react-dsfr/Button'
import { zodResolver } from '@hookform/resolvers/zod'
import { FC } from 'react'
import { useForm } from 'react-hook-form'
import { useExportExcelSimulation } from '~/hooks/use-export-excel-simulation'
import { TSimulationExportDto, ZSimulationExportDto } from '~/schemas/simulation'

export const ExportExcelSimulationButton: FC<{ id: string }> = ({ id }) => {
  const { isPending, mutateAsync } = useExportExcelSimulation()

  const { handleSubmit } = useForm<TSimulationExportDto>({
    resolver: zodResolver(ZSimulationExportDto),
    values: { id },
  })

  const onSubmit = async () => await mutateAsync(id)

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Button iconId="ri-download-line" priority="primary" type="submit" disabled={isPending}>
        {isPending ? 'Téléchargement en cours...' : 'Télécharger'}
      </Button>
    </form>
  )
}
