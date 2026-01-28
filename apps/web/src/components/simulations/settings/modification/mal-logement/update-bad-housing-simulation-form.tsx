'use client'

import Button from '@codegouvfr/react-dsfr/Button'
import { zodResolver } from '@hookform/resolvers/zod'
import { FC } from 'react'
import { useForm } from 'react-hook-form'
import { tss } from 'tss-react'
import { useBadHousingSettings } from '~/app/(authenticated)/simulation/[id]/modifier/mal-logement/simulation-scenario-bad-housing-modification-provider'
import { useUpdateBadHousingSimulation } from '~/hooks/use-update-simulation'
import { ESourceB11, ESourceB14, ESourceB15 } from '~/schemas/scenario'
import { TUpdateBadHousingSimulationDto, ZUpdateBadHousingSimulationDto } from '~/schemas/simulation'

export const UpdateBadHousingSimulationForm: FC = () => {
  const { badHousingSettings } = useBadHousingSettings()
  const { classes } = useStyles()
  const { isPending, mutateAsync } = useUpdateBadHousingSimulation()

  const {
    formState: { isValid },
    getValues,
    handleSubmit,
  } = useForm<TUpdateBadHousingSimulationDto>({
    resolver: zodResolver(ZUpdateBadHousingSimulationDto),
    values: {
      id: badHousingSettings.simulationId,
      scenario: {
        b11_etablissement: badHousingSettings.horsLogement.accommodationTypes,
        b11_fortune: badHousingSettings.horsLogement.fortune,
        b11_hotel: badHousingSettings.horsLogement.hotel,
        b11_part_etablissement: badHousingSettings.horsLogement.part,
        b11_sa: badHousingSettings.horsLogement.sa,
        b12_cohab_interg_subie: badHousingSettings.heberges.part,
        b12_heberg_particulier: badHousingSettings.heberges.particular,
        b12_heberg_temporaire: badHousingSettings.heberges.temporary,
        b13_acc: badHousingSettings.inadequationFinanciere.accedant,
        b13_plp: badHousingSettings.inadequationFinanciere.plp,
        b13_taux_effort: badHousingSettings.inadequationFinanciere.maxEffort,
        b13_taux_reallocation: badHousingSettings.inadequationFinanciere.part,
        b14_confort: badHousingSettings.badQuality.confort,
        b14_occupation: badHousingSettings.badQuality.occupation,
        b14_qualite: '',
        b14_taux_reallocation: badHousingSettings.badQuality.part,
        b15_loc_hors_hlm: badHousingSettings.suroccupation.plp,
        b15_proprietaire: badHousingSettings.suroccupation.proprietaire,
        b15_surocc: badHousingSettings.suroccupation.surocc,
        b15_taux_reallocation: badHousingSettings.suroccupation.part,
        b1_horizon_resorption: badHousingSettings.horizon,
        id: badHousingSettings.id,
        source_b11: badHousingSettings.horsLogement.source as ESourceB11,
        source_b14: badHousingSettings.badQuality.source as ESourceB14,
        source_b15: badHousingSettings.suroccupation.source as ESourceB15,
      },
    },
  })

  const onSubmit = async () => await mutateAsync(getValues())

  return (
    <div className={classes.container}>
      <Button onClick={handleSubmit(onSubmit)} disabled={!isValid || isPending}>
        Accéder au résultat
      </Button>
    </div>
  )
}

const useStyles = tss.create({
  container: {
    display: 'flex',
    gap: '1rem',
    justifyContent: 'flex-end',
  },
})
