'use client'

import Button from '@codegouvfr/react-dsfr/Button'
import Input from '@codegouvfr/react-dsfr/Input'
import { zodResolver } from '@hookform/resolvers/zod'
import { parseAsArrayOf, parseAsInteger, parseAsString, useQueryStates } from 'nuqs'
import { FC } from 'react'
import { useForm } from 'react-hook-form'
import { tss } from 'tss-react'
import { useEpcisRates } from '~/app/(authenticated)/simulation/(creation)/(rates-provider)/rates-provider'
import { CreateValidationAccommodationsSettingsRates } from '~/components/simulations/validation-settings/create-validation-accommodation-rates'
import { CreateValidationRestructurationDisparitionRates } from '~/components/simulations/validation-settings/create-validation-restructuration-disparition-rates'
import { ValidationSettingsInputEpci } from '~/components/simulations/validation-settings/validation-settings-input-epci'
import { useCreateSimulation } from '~/hooks/use-create-simulation'
import { TInitSimulationDto, ZInitSimulationDto } from '~/schemas/simulation'
import { getOmphaleLabel } from '~/utils/omphale-label'

export const CreateSimulationForm: FC = () => {
  const { classes } = useStyles()
  const createSimulationForResults = useCreateSimulation()
  const createSimulationForBadHousing = useCreateSimulation({
    redirectUri: '/simulation/{{id}}/modifier/mal-logement/horizon-de-resorption',
  })
  const { rates } = useEpcisRates()

  const [queryStates] = useQueryStates({
    epci: parseAsString,
    omphale: parseAsString,
    baseEpci: parseAsString,
    projection: parseAsInteger,
    region: parseAsString,
    epciGroupName: parseAsString,
    epciGroupId: parseAsString,
    epcis: parseAsArrayOf(parseAsString).withDefault([]),
    demographicEvolutionOmphaleCustomIds: parseAsArrayOf(parseAsString).withDefault([]),
  })

  // Use epcis from query states, or fall back to all EPCIs in rates if none specified
  const selectedEpcis = queryStates.epcis.length > 0 ? queryStates.epcis : Object.keys(rates)

  const {
    register,
    formState: { errors },
    getValues,
    handleSubmit,
  } = useForm<TInitSimulationDto>({
    resolver: zodResolver(ZInitSimulationDto),
    values: {
      name: '',
      epci: selectedEpcis.map((epciCode) => ({ code: epciCode })),
      epciGroupId: queryStates.epciGroupId,
      epciGroupName: queryStates.epciGroupName,
      scenario: {
        b2_scenario: queryStates.omphale as string,
        epcis: selectedEpcis.reduce(
          (acc, epciCode) => {
            const epciRates = rates[epciCode]
            if (epciRates) {
              acc[epciCode] = {
                b2_tx_rs: epciRates.txRS ?? undefined,
                b2_tx_vacance: epciRates.vacancyRate ?? undefined,
                b2_tx_vacance_longue: epciRates.longTermVacancyRate ?? undefined,
                b2_tx_vacance_courte: epciRates.shortTermVacancyRate ?? undefined,
                b2_tx_restructuration: epciRates.restructuringRate ?? undefined,
                b2_tx_disparition: epciRates.disappearanceRate ?? undefined,
                baseEpci: queryStates.baseEpci === epciCode,
              }
            }
            return acc
          },
          {} as Record<string, TInitSimulationDto['scenario']['epcis'][string]>,
        ),
        projection: (queryStates.projection as number) ?? 2030,
        demographicEvolutionOmphaleCustomIds: queryStates.demographicEvolutionOmphaleCustomIds,
      },
    },
  })

  const onSubmitForResults = async () => {
    return createSimulationForResults.mutateAsync(getValues())
  }

  const onSubmitForBadHousing = async () => {
    return createSimulationForBadHousing.mutateAsync(getValues())
  }

  return (
    <>
      <div className={classes.subContainer}>
        <h4>Général</h4>
        <Input
          label=""
          state={errors.name ? 'error' : 'default'}
          stateRelatedMessage={errors.name && errors.name.message}
          hintText="Nom de la simulation"
          nativeInputProps={{ ...register('name', { required: true }) }}
        />
      </div>
      <div className={classes.subContainer}>
        <h4>Territoire et horizon temporel</h4>
        <div className={classes.settingsContainer}>
          <ValidationSettingsInputEpci />
          <Input
            disabled
            label=""
            iconId="ri-calendar-line"
            hintText="Année de projection"
            style={{ flex: 1 }}
            nativeInputProps={{ value: queryStates.projection as number }}
          />
        </div>
      </div>
      <div className={classes.subContainer}>
        <h4>Projection d&apos;évolution démographique</h4>
        <Input
          disabled
          label=""
          hintText="Scénario Omphale"
          nativeInputProps={{ value: getOmphaleLabel(queryStates.omphale as string) as string }}
        />
      </div>
      <CreateValidationAccommodationsSettingsRates />
      <CreateValidationRestructurationDisparitionRates />
      <div className={classes.buttonContainer}>
        <Button priority="secondary" onClick={handleSubmit(onSubmitForBadHousing)} disabled={createSimulationForBadHousing.isPending}>
          Paramétrer le mal-logement
        </Button>
        <Button onClick={handleSubmit(onSubmitForResults)} disabled={createSimulationForResults.isPending}>
          Accéder au résultat
        </Button>
      </div>
    </>
  )
}

const useStyles = tss.create({
  subContainer: {
    backgroundColor: 'var(--background-default-grey)',
    padding: '1rem',
  },
  settingsContainer: {
    display: 'flex',
    gap: '1rem',
  },
  buttonContainer: {
    display: 'flex',
    gap: '1rem',
    justifyContent: 'flex-end',
  },
})
