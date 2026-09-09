'use client'

import { fr } from '@codegouvfr/react-dsfr'
import Alert from '@codegouvfr/react-dsfr/Alert'
import Badge from '@codegouvfr/react-dsfr/Badge'
import { Breadcrumb } from '@codegouvfr/react-dsfr/Breadcrumb'
import Button from '@codegouvfr/react-dsfr/Button'
import Checkbox from '@codegouvfr/react-dsfr/Checkbox'
import Input from '@codegouvfr/react-dsfr/Input'
import { createModal } from '@codegouvfr/react-dsfr/Modal'
import RadioButtons from '@codegouvfr/react-dsfr/RadioButtons'
import { Select } from '@codegouvfr/react-dsfr/SelectNext'
import Table from '@codegouvfr/react-dsfr/Table'
import Tag from '@codegouvfr/react-dsfr/Tag'
import { zodResolver } from '@hookform/resolvers/zod'
import classNames from 'classnames'
import dayjs from 'dayjs'
import Link from 'next/link'
import React from 'react'
import { Controller, useForm } from 'react-hook-form'
import { GenericCard } from '~/components/common/generic-card/generic-card'
import { TPowerpointDuplicateCheck, TPowerpointDuplicateReason, useCheckPowerpointDuplicate } from '~/hooks/use-check-powerpoint-duplicate'
import { useRequestPowerpoint } from '~/hooks/use-request-powerpoint'
import { TRequestPowerpoint, ZRequestPowerpoint } from '~/schemas/export'
import { TSimulationWithRelations } from '~/schemas/simulation'
import { sPluriel } from '~/utils/sPluriel'
import { MultipleEpciSelect } from './multiple-epci-select'
import styles from './tableau-de-bord.module.css'

type TableauDeBordProps = {
  simulations: TSimulationWithRelations[]
  groupName: string
  userEmail: string
}

const reasonLabel = (reason: TPowerpointDuplicateReason, windowMinutes: number): string => {
  switch (reason) {
    case 'RECENT':
      return `vous avez fait une demande sur ce territoire il y a moins de ${windowMinutes} minutes`
    case 'SAME_DAY':
      return "vous avez déjà fait une demande sur ce territoire aujourd'hui"
    case 'SAME_SCENARIOS_AND_TERRITORY':
      return 'les scénarios et le territoire demandés sont exactement les mêmes'
  }
}

const modalActions = createModal({
  id: 'form-confirmation-modal',
  isOpenedByDefault: false,
})

export function TableauDeBord({ simulations, groupName, userEmail }: TableauDeBordProps) {
  const notEnoughSimulations = simulations.length < 3
  const { mutateAsync, isError, isSuccess, isPending, error, progressMessage } = useRequestPowerpoint()
  const { checkDuplicate, isChecking } = useCheckPowerpointDuplicate()
  const [duplicateCheck, setDuplicateCheck] = React.useState<TPowerpointDuplicateCheck | null>(null)
  const previousRequest = duplicateCheck?.previousRequest ?? null

  // Extract unique EPCIs from all simulations
  const uniqueEpcis = Array.from(new Map(simulations.flatMap((sim) => sim.epcis).map((epci) => [epci.code, epci])).values())

  const {
    control,
    handleSubmit,
    formState: { errors, isValid },
    reset,
    getValues,
    watch,
    setValue,
  } = useForm<TRequestPowerpoint>({
    resolver: zodResolver(ZRequestPowerpoint),
    defaultValues: {
      nextStep: '',
      resultDate: '',
      selectedSimulations: [],
      privilegedSimulation: '',
      documentType: '',
      periodStart: '',
      periodEnd: '',
      epci: undefined,
      epcis: undefined,
      privilegedSimulationProjection: undefined,
    },
    mode: 'onChange',
  })
  const { nextStep, resultDate } = getValues()
  const selectedSimulations = watch('selectedSimulations')
  const privilegedSimulation = watch('privilegedSimulation')
  const documentType = watch('documentType')

  // Update privileged simulation projection when privileged simulation changes
  const privilegedSimulationData = simulations.find((sim) => sim.id === privilegedSimulation)
  React.useEffect(() => {
    if (privilegedSimulationData?.scenario.projection) {
      setValue('privilegedSimulationProjection', privilegedSimulationData.scenario.projection, { shouldValidate: true })
    }
  }, [privilegedSimulation, privilegedSimulationData, setValue])

  const onRequestPowerpoint = async (data: TRequestPowerpoint) => {
    try {
      await mutateAsync({ ...data, replacesRequestId: previousRequest?.requestId })
      modalActions.close()
      reset()
      setDuplicateCheck(null)
    } catch (error) {
      // Keep modal open to show error, don't reset form
      console.error('PowerPoint request failed:', error)
    }
  }

  const onConfirmAction = async () => {
    await handleSubmit(onRequestPowerpoint)()
  }

  // La recherche d'une demande récente précède l'ouverture de la modale : c'est
  // elle qui décide si l'on demande une simple confirmation ou un remplacement.
  const handleModalOpen = async () => {
    setDuplicateCheck(null)
    try {
      const { epci: selectedEpci, epcis: selectedEpcis, selectedSimulations: simulationIds } = getValues()
      const epciCodes =
        selectedEpcis && selectedEpcis.length > 0 ? selectedEpcis.map((item) => item.code) : selectedEpci ? [selectedEpci.code] : []

      setDuplicateCheck(await checkDuplicate({ selectedSimulations: simulationIds, epciCodes }))
    } catch (error) {
      // Confort d'affichage seulement : si la vérification échoue, l'API refusera
      // de toute façon une demande en doublon qui n'aurait pas été confirmée.
      console.error('Duplicate check failed:', error)
    }
    modalActions.open()
  }

  return (
    <div>
      <Breadcrumb
        currentPageLabel={groupName}
        homeLinkProps={{
          href: '/',
        }}
        segments={[{ label: 'Tableau de bord', linkProps: { href: '/tableaux-de-bord' } }]}
      />
      <div className={fr.cx('fr-grid-row', 'fr-grid-row--gutters')}>
        <div className={fr.cx('fr-col-offset-lg-2')} />
        <div className={fr.cx('fr-col-lg-8', 'fr-col-12')}>
          <h1 className={fr.cx('fr-col-12')}>Tableau de bord</h1>

          <h2>{groupName}</h2>

          <div className={fr.cx('fr-callout', 'fr-mb-4w')}>
            <h3 className={fr.cx('fr-callout__title')}>Territoires concernés</h3>
            <div className={fr.cx('fr-callout__text')}>
              <p className={fr.cx('fr-text--sm', 'fr-mb-2w')}>
                Les simulations de ce groupe portent sur {uniqueEpcis.length} territoire{sPluriel(uniqueEpcis.length)} :
              </p>
              <div>
                {uniqueEpcis.map((epci, index) => (
                  <span key={epci.code}>
                    <Badge small>{epci.name}</Badge>
                    {index < uniqueEpcis.length - 1 && ' '}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <form>
            <div className={fr.cx('fr-mb-6w')}>
              <p className={classNames(fr.cx('fr-label', 'fr-mb-1w'), styles.labelCards)}>
                Sélectionnez des scénarios à inclure : <span className={fr.cx('fr-text--sm')}>({selectedSimulations.length}/3)</span>
              </p>
              {selectedSimulations.length > 0 && (
                <p className={fr.cx('fr-text--sm', 'fr-mb-2w')} style={{ color: '#666' }}>
                  Le scénario privilégié sera mis en avant dans la présentation PowerPoint.
                </p>
              )}
              <div className={fr.cx('fr-grid-row', 'fr-grid-row--gutters', 'fr-mb-2w')}>
                {simulations.map((simulation) => (
                  <div key={simulation.id} className={fr.cx('fr-col-12', 'fr-col-md-6')}>
                    <GenericCard
                      header={
                        <div className={styles.tagContainer}>
                          <Badge small severity="info">
                            Horizon {simulation.scenario.projection}
                          </Badge>
                          <Badge small>{getPopulationScenarioLabel(simulation.scenario.b2_scenario) || ''}</Badge>
                          <Badge small>{getDecohabitationScenarioLabel(simulation.scenario.b2_scenario) || ''}</Badge>
                        </div>
                      }
                      headerAction={
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', alignItems: 'flex-end' }}>
                          <Controller
                            control={control}
                            name="selectedSimulations"
                            render={({ field }) => (
                              <Checkbox
                                small
                                className={styles.checkbox}
                                options={[
                                  {
                                    label: 'Inclure',
                                    nativeInputProps: {
                                      checked: field.value.includes(simulation.id),
                                      disabled: !field.value.includes(simulation.id) && field.value.length >= 3,
                                      onChange: (e) => {
                                        if (e.target.checked) {
                                          field.onChange([...field.value, simulation.id])
                                        } else {
                                          field.onChange(field.value.filter((id: string) => id !== simulation.id))
                                          // If this was the privileged simulation, clear it
                                          if (privilegedSimulation === simulation.id) {
                                            setValue('privilegedSimulation', '', { shouldValidate: true, shouldDirty: true })
                                          }
                                        }
                                      },
                                    },
                                  },
                                ]}
                              />
                            )}
                          />
                          <Controller
                            control={control}
                            name="privilegedSimulation"
                            render={({ field }) => (
                              <RadioButtons
                                small
                                options={[
                                  {
                                    label: 'Privilégié',
                                    nativeInputProps: {
                                      checked: field.value === simulation.id,
                                      disabled: !selectedSimulations.includes(simulation.id),
                                      onChange: () => field.onChange(simulation.id),
                                    },
                                  },
                                ]}
                              />
                            )}
                          />
                        </div>
                      }
                      title={<Link href={`/simulation/${simulation.id}/resultats`}>{simulation.name}</Link>}
                      footer={<div className={styles.cardMention}>MàJ le {dayjs(simulation.updatedAt).format('DD/MM/YYYY')}</div>}
                    />
                  </div>
                ))}
              </div>

              {errors.selectedSimulations && <p className={fr.cx('fr-error-text', 'fr-mb-3w')}>{errors.selectedSimulations.message}</p>}
              {errors.privilegedSimulation && <p className={fr.cx('fr-error-text', 'fr-mb-3w')}>{errors.privilegedSimulation.message}</p>}
            </div>

            <div className={fr.cx('fr-mb-6w')}>
              <Controller
                control={control}
                name="documentType"
                render={({ field }) => (
                  <Select
                    label={<strong>Type de document</strong>}
                    placeholder="Choisir"
                    options={['PLH', 'SCoT', "Document d'Urbanisme"].map((value) => ({
                      value,
                      label: value,
                    }))}
                    state={errors.documentType ? 'error' : undefined}
                    stateRelatedMessage={errors.documentType?.message}
                    nativeSelectProps={{
                      value: field.value,
                      onChange: (e) => {
                        field.onChange(e)
                        if (e.target.value === 'SCoT') {
                          setValue('epci', undefined, { shouldDirty: true, shouldValidate: true })
                        } else {
                          setValue('epcis', undefined, { shouldDirty: true, shouldValidate: true })
                        }
                      },
                    }}
                  />
                )}
              />
            </div>
            <div className="fr-flex fr-direction-column fr-mb-4w">
              <div className="fr-flex fr-justify-content-space-between fr-flex-gap-4v">
                <Controller
                  control={control}
                  name="periodStart"
                  render={({ field }) => (
                    <Input
                      style={{ flex: 1 }}
                      label={<strong>Année de début du Document</strong>}
                      state={errors.periodStart ? 'error' : undefined}
                      stateRelatedMessage={errors.periodStart?.message}
                      nativeInputProps={{
                        type: 'text',
                        value: field.value,
                        onChange: field.onChange,
                        placeholder: 'ex: 2026',
                        maxLength: 4,
                      }}
                    />
                  )}
                />
                <Controller
                  control={control}
                  name="periodEnd"
                  render={({ field }) => (
                    <Input
                      style={{ flex: 1 }}
                      label={<strong>Année de fin du Document</strong>}
                      state={errors.periodEnd ? 'error' : undefined}
                      stateRelatedMessage={errors.periodEnd?.message}
                      nativeInputProps={{
                        type: 'text',
                        value: field.value,
                        onChange: field.onChange,
                        placeholder: 'ex: 2032',
                        maxLength: 4,
                      }}
                    />
                  )}
                />
              </div>
              <div className="fr-mt-2w">
                <Alert
                  severity="info"
                  description="Un focus sur le besoin en logements de la période sélectionnée sera ajouté dans le powerpoint éditable."
                  small
                />
              </div>
            </div>

            {documentType === 'SCoT' ? (
              <Controller
                control={control}
                name="epcis"
                render={({ field }) => (
                  <MultipleEpciSelect
                    epcis={uniqueEpcis}
                    selectedEpcis={field.value || []}
                    onChange={field.onChange}
                    error={errors.epcis?.message}
                  />
                )}
              />
            ) : (
              <div className={fr.cx('fr-mb-6w')}>
                <Controller
                  control={control}
                  name="epci"
                  render={({ field }) => (
                    <Select
                      label={<strong>Votre territoire (EPCI pour lequel vous souhaitez obtenir votre résultat)</strong>}
                      placeholder="Choisir un EPCI"
                      options={uniqueEpcis.map((epci) => ({
                        value: epci.code,
                        label: epci.name,
                      }))}
                      state={errors.epci ? 'error' : undefined}
                      stateRelatedMessage={errors.epci?.message}
                      nativeSelectProps={{
                        value: field.value?.code,
                        onChange: (e) => {
                          const selectedEpci = uniqueEpcis.find((epci) => epci.code === e.target.value)
                          if (selectedEpci) {
                            field.onChange({
                              code: selectedEpci.code,
                              name: selectedEpci.name,
                            })
                          }
                        },
                      }}
                    />
                  )}
                />
              </div>
            )}

            <div className={fr.cx('fr-mb-6w')}>
              <Controller
                control={control}
                name="nextStep"
                render={({ field }) => (
                  <Select
                    label={<strong>Quelle est la prochaine étape de votre travail ?</strong>}
                    placeholder="Choisir"
                    options={['Atelier de travail', 'Présentation aux élus', 'Prise de décision', 'Autre'].map((value) => ({
                      value,
                      label: value,
                    }))}
                    state={errors.nextStep ? 'error' : undefined}
                    stateRelatedMessage={errors.nextStep?.message}
                    nativeSelectProps={{
                      value: field.value,
                      onChange: field.onChange,
                    }}
                  />
                )}
              />
            </div>

            <div className={fr.cx('fr-mb-12w')}>
              <Controller
                control={control}
                name="resultDate"
                render={({ field }) => (
                  <Input
                    label={<strong>À quelle date prévoyez-vous de restituer les résultats ?</strong>}
                    state={errors.resultDate ? 'error' : undefined}
                    stateRelatedMessage={errors.resultDate?.message}
                    nativeInputProps={{
                      type: 'date',
                      value: field.value,
                      onChange: field.onChange,
                      min: dayjs().format('YYYY-MM-DD'),
                    }}
                  />
                )}
              />
            </div>

            {notEnoughSimulations && (
              <p className={fr.cx('fr-info-text', 'fr-grid-row--center')}>
                Il faut avoir paramétré au moins 3 scénarios dans la simulation pour pouvoir la télécharger.
              </p>
            )}

            {isPending && (
              <Alert
                description={
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div
                      style={{
                        width: '1rem',
                        height: '1rem',
                        border: '2px solid #f3f3f3',
                        borderTop: '2px solid #3498db',
                        borderRadius: '50%',
                        animation: 'spin 1s linear infinite',
                      }}
                    />
                    <span>{progressMessage || 'Traitement en cours...'}</span>
                    <style jsx>{`
                      @keyframes spin {
                        0% { transform: rotate(0deg); }
                        100% { transform: rotate(360deg); }
                      }
                    `}</style>
                  </div>
                }
                severity="info"
                title="Génération en cours"
              />
            )}

            {isSuccess && (
              <Alert
                closable
                description={
                  <>
                    Votre présentation PowerPoint personnalisée avec les simulations sélectionnées est en cours de préparation. Vous la
                    recevrez à l'adresse e-mail <Tag>{userEmail}</Tag> dans un délai de 72h ouvrées.
                  </>
                }
                severity="success"
                title="Demande de présentation bien reçue !"
              />
            )}

            {isError && (
              <Alert
                closable
                description={error?.message || 'Veuillez réessayer ultérieurement.'}
                severity="error"
                title="Une erreur est survenue"
              />
            )}

            <div className={styles.actions}>
              <Button type="button" onClick={() => handleModalOpen()} disabled={notEnoughSimulations || !isValid || isChecking}>
                {isChecking ? 'Vérification en cours...' : 'Recevoir le powerpoint éditable'}
              </Button>
            </div>

            {!notEnoughSimulations && (
              <p className={fr.cx('fr-info-text', 'fr-grid-row--center')}>Le powerpoint vous sera envoyé par e-mail sous 3 jours ouvrés.</p>
            )}
          </form>
        </div>
      </div>

      <modalActions.Component
        title={previousRequest ? 'Vous avez déjà demandé un export similaire' : "Confirmation d'envoi du powerpoint"}
        buttons={[
          {
            doClosesModal: true,
            children: previousRequest ? 'Non, annuler ma demande' : 'Annuler',
            disabled: isPending,
          },
          {
            doClosesModal: false,
            children: isPending
              ? progressMessage || 'Génération en cours...'
              : previousRequest
                ? 'Oui, remplacer ma demande précédente'
                : "Confirmer l'envoi",
            onClick: onConfirmAction,
            disabled: isPending,
          },
        ]}
      >
        <div>
          {previousRequest && (
            <Alert
              className={fr.cx('fr-mb-4w')}
              severity="warning"
              title="Une demande similaire existe déjà"
              description={
                <>
                  <p>
                    Vous avez réalisé une demande d'export le{' '}
                    <strong>{dayjs(previousRequest.requestedAt).format('DD/MM/YYYY à HH:mm')}</strong>.
                  </p>
                  <ul>
                    {previousRequest.reasons.map((reason) => (
                      <li key={reason}>{reasonLabel(reason, duplicateCheck?.windowMinutes ?? 0)}</li>
                    ))}
                  </ul>
                  <p>
                    Demande précédente : {previousRequest.documentType ?? 'type non renseigné'}
                    {previousRequest.epciNames.length > 0 ? ` — ${previousRequest.epciNames.join(', ')}` : ''}
                    {previousRequest.simulationNames.length > 0 ? ` — ${previousRequest.simulationNames.join(', ')}` : ''}
                  </p>
                  <p>Souhaitez-vous la remplacer par celle-ci ? L'équipe Otelo ne traitera alors que la nouvelle demande.</p>
                </>
              }
            />
          )}
          <div>
            <strong>Email: </strong>
            <Tag>{userEmail}</Tag>
          </div>
          <Table
            caption="Récapitulatif des données"
            data={[
              [
                'Scénario(s)',
                selectedSimulations
                  .sort((a, b) => {
                    // Put privileged scenario first
                    if (a === privilegedSimulation) return -1
                    if (b === privilegedSimulation) return 1
                    return 0
                  })
                  .map((simId) => {
                    const simulation = simulations.find((sim) => sim.id === simId)
                    const isPrivileged = simId === privilegedSimulation
                    return simulation ? (
                      <Badge small key={simId} severity={isPrivileged ? 'success' : undefined}>
                        {simulation.name} (Horizon {simulation.scenario.projection})
                      </Badge>
                    ) : null
                  }),
              ],
              ['Prochaine étape', nextStep],
              ['Date de restitution prévue', resultDate ? dayjs(resultDate).format('DD/MM/YYYY') : 'Non spécifiée'],
            ]}
            headers={['Paramétrage', '']}
          />
          {isError && (
            <Alert
              description={error?.message || 'Une erreur est survenue lors de la génération. Veuillez réessayer.'}
              severity="error"
              title="Erreur"
              className={fr.cx('fr-mb-4w')}
            />
          )}

          {isPending && (
            <Alert
              description={
                <div className={styles.spinnerContainer}>
                  <div className={styles.spinner} />
                  <span>{progressMessage || 'Traitement en cours...'}</span>
                </div>
              }
              severity="info"
              title="Génération en cours"
              className={fr.cx('fr-mb-4w')}
            />
          )}
        </div>
      </modalActions.Component>
    </div>
  )
}

const getPopulationScenarioLabel = (scenario: string) => {
  switch (scenario) {
    case 'Central_B':
    case 'Central_C':
    case 'Central_H':
    default:
      return 'Population Centrale'
    case 'PB_B':
    case 'PB_C':
    case 'PB_H':
      return 'Population Basse'
    case 'PH_B':
    case 'PH_C':
    case 'PH_H':
      return 'Population Haute'
  }
}

const getDecohabitationScenarioLabel = (scenario: string) => {
  switch (scenario) {
    case 'Central_C':
    case 'PB_C':
    case 'PH_C':
    default:
      return 'Décohabitation tendanciel'
    case 'Central_B':
    case 'PB_B':
    case 'PH_B':
      return 'Décohabitation décélération'
    case 'Central_H':
    case 'PB_H':
    case 'PH_H':
      return 'Décohabitation accélération'
  }
}
