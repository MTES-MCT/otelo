'use client'
import Input from '@codegouvfr/react-dsfr/Input'
import { createModal } from '@codegouvfr/react-dsfr/Modal'
import { zodResolver } from '@hookform/resolvers/zod'
import { parseAsArrayOf, parseAsInteger, parseAsString, useQueryStates } from 'nuqs'
import { FC } from 'react'
import { useForm } from 'react-hook-form'
import { useEpcisRates } from '~/app/(authenticated)/simulation/(creation)/(rates-provider)/rates-provider'
import { useCreateSimulation } from '~/hooks/use-create-simulation'
import { TInitSimulationDto, ZInitSimulationDto } from '~/schemas/simulation'

const modal = createModal({
  id: 'scenario-naming-modal',
  isOpenedByDefault: false,
})

export const ScenarioNamingModal: FC = () => {
  const createSimulationForResults = useCreateSimulation()
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
    reset,
  } = useForm<TInitSimulationDto>({
    resolver: zodResolver(ZInitSimulationDto),
    values: {
      name: undefined,
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

  const onSubmit = async () => {
    const values = getValues()
    try {
      await createSimulationForResults.mutateAsync({ ...values, name: values.name || 'Scénario ' })
      reset()
      modal.close()
    } catch (error) {
      console.error('Error creating simulation:', error)
    }
  }

  return (
    <modal.Component
      title="Comment souhaitez-vous nommer ce scénario ?"
      buttons={[
        {
          children: 'Nommer plus tard',
          priority: 'secondary',
          onClick: handleSubmit(onSubmit),
          disabled: createSimulationForResults.isPending,
        },
        {
          children: 'Afficher les résultats',
          onClick: handleSubmit(onSubmit),
          disabled: createSimulationForResults.isPending,
        },
      ]}
    >
      <Input
        label="Nom du scénario"
        state={errors.name ? 'error' : 'default'}
        stateRelatedMessage={errors.name && errors.name.message}
        nativeInputProps={{
          ...register('name', { required: 'Le nom du scénario est requis' }),
          placeholder: 'Saisissez le nom de votre scénario',
        }}
      />
    </modal.Component>
  )
}

export const useScenarioNamingModal = () => modal
