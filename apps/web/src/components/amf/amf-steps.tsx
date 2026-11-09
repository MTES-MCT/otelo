'use client'

import { fr } from '@codegouvfr/react-dsfr'
import Alert from '@codegouvfr/react-dsfr/Alert'
import Input from '@codegouvfr/react-dsfr/Input'
import { RadioButtons } from '@codegouvfr/react-dsfr/RadioButtons'
import Link from 'next/link'
import { FC, useRef, useState } from 'react'
import { TAmfDemography, TAmfEpci, TAmfSecondaryResidences, TAmfVacancy } from '~/components/amf/amf-types'
import { AutocompleteInput } from '~/components/simulations/autocomplete/autocomplete-input'
import { GeoApiCommuneResult, GeoApiEpciResult } from '~/hooks/use-geoapi-search'

const numberFormatter = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 })

/** Nombre formaté en `fr-FR`, précédé de son signe (« + », « − » ou rien pour zéro). */
export const formatSigned = (value: number): string => {
  const sign = value > 0 ? '+' : value < 0 ? '−' : ''
  return `${sign}${numberFormatter.format(Math.abs(value))}`
}

export const formatNumber = (value: number): string => numberFormatter.format(value)

export const AmfIntroStep: FC = () => (
  <>
    <h1 className={fr.cx('fr-h2')}>Votre besoin en logements en 3 minutes !</h1>
    <p className={fr.cx('fr-text--lead')}>
      Obtenez une première estimation simplifiée de votre besoin en logement d&apos;ici 2036 sur votre territoire en seulement 5 questions.
    </p>
  </>
)

type EpciLookupState = { status: 'idle' } | { status: 'loading' } | { status: 'not-covered' } | { status: 'error' }

type AmfEpciStepProps = {
  epci: TAmfEpci | null
  onChange: (epci: TAmfEpci | null) => void
}

export const AmfEpciStep: FC<AmfEpciStepProps> = ({ epci, onChange }) => {
  const [lookup, setLookup] = useState<EpciLookupState>({ status: 'idle' })
  // Seule la dernière sélection compte : une réponse plus lente d'un choix précédent est ignorée.
  const lastRequest = useRef(0)

  const handleSelect = async (item: GeoApiEpciResult | GeoApiCommuneResult) => {
    // Une commune porte l'EPCI auquel elle appartient ; sans EPCI, elle est ignorée.
    const epciCode = 'codesRegions' in item ? item.code : item.codeEpci
    if (!epciCode) {
      return
    }

    const requestId = ++lastRequest.current
    onChange(null)
    setLookup({ status: 'loading' })

    try {
      const res = await fetch(`/api/amf/epcis/${encodeURIComponent(epciCode)}`)
      const body = res.ok ? ((await res.json()) as TAmfEpci) : null
      if (requestId !== lastRequest.current) {
        return
      }
      if (res.status === 404) {
        setLookup({ status: 'not-covered' })
        return
      }
      if (!body) {
        setLookup({ status: 'error' })
        return
      }
      onChange(body)
      setLookup({ status: 'idle' })
    } catch {
      if (requestId === lastRequest.current) {
        setLookup({ status: 'error' })
      }
    }
  }

  return (
    <>
      <h2>Quel est votre EPCI ?</h2>
      <AutocompleteInput
        label="Nom de votre EPCI ou d'une commune"
        hintText="Saisissez au moins 3 caractères, puis choisissez dans la liste"
        defaultValue={epci?.name}
        onClick={handleSelect}
      />

      <div aria-live="polite" className={fr.cx('fr-mt-3w')}>
        {lookup.status === 'loading' && <p>Recherche du territoire…</p>}

        {lookup.status === 'not-covered' && (
          <Alert
            severity="warning"
            small
            description={
              <>
                Ce territoire n&apos;est pas encore couvert par ce questionnaire, retrouvez-le sur <Link href="/">Otelo</Link>.
              </>
            }
          />
        )}

        {lookup.status === 'error' && (
          <Alert severity="error" small description="Le territoire n'a pas pu être chargé. Veuillez réessayer." />
        )}

        {epci && (
          <>
            <p className={fr.cx('fr-mb-2w')}>
              Territoire choisi : <strong>{epci.name}</strong>
            </p>
            {epci.fragileProjection && (
              <Alert
                severity="info"
                small
                description="Les projections démographiques de ce territoire sont fragiles : les chiffres sont à interpréter avec prudence."
              />
            )}
          </>
        )}
      </div>
    </>
  )
}

type ChoiceStepProps<T extends string> = {
  value: T | null
  onChange: (value: T) => void
}

type AmfDemographyStepProps = ChoiceStepProps<TAmfDemography> & { epci: TAmfEpci }

export const AmfDemographyStep: FC<AmfDemographyStepProps> = ({ epci, value, onChange }) => {
  const { haute, central, basse } = epci.populationChanges
  const options: Array<{ value: TAmfDemography; label: string }> = [
    { value: 'plus', label: `Une évolution plus favorable (${formatSigned(haute)} habitants)` },
    { value: 'tendance', label: `Dans la tendance actuelle (${formatSigned(central)} habitants)` },
    // Sans projection basse pour ce territoire, le scénario n'est pas proposé.
    ...(basse === null ? [] : [{ value: 'moins' as const, label: `Une évolution moins favorable (${formatSigned(basse)} habitants)` }]),
  ]

  return (
    <RadioButtons
      legend={<h2 className={fr.cx('fr-mb-0')}>D&apos;ici 2036, selon vous, la population de votre territoire connaîtra :</h2>}
      name="amf-demography"
      options={options.map((option) => ({
        label: option.label,
        nativeInputProps: { value: option.value, checked: value === option.value, onChange: () => onChange(option.value) },
      }))}
    />
  )
}

const VACANCY_OPTIONS: Array<{ value: TAmfVacancy; label: string }> = [
  { value: 'prioritaire', label: "Oui, c'est prioritaire" },
  { value: 'parmi-autres', label: "Oui, parmi d'autres mesures" },
  { value: 'non', label: "Ça n'est pas le plus utile pour mon territoire" },
]

export const AmfVacancyStep: FC<ChoiceStepProps<TAmfVacancy>> = ({ value, onChange }) => (
  <RadioButtons
    legend={<h2 className={fr.cx('fr-mb-0')}>D&apos;après vous, est-ce une priorité de remobiliser des logements vacants ?</h2>}
    name="amf-vacancy"
    options={VACANCY_OPTIONS.map((option) => ({
      label: option.label,
      nativeInputProps: { value: option.value, checked: value === option.value, onChange: () => onChange(option.value) },
    }))}
  />
)

type AmfBadHousingStepProps = {
  value: boolean | null
  onChange: (value: boolean) => void
}

export const AmfBadHousingStep: FC<AmfBadHousingStepProps> = ({ value, onChange }) => (
  <RadioButtons
    legend={<h2 className={fr.cx('fr-mb-0')}>Le mal-logement est-il une problématique importante sur votre territoire ?</h2>}
    name="amf-bad-housing"
    options={[
      { label: 'Oui', nativeInputProps: { value: 'oui', checked: value === true, onChange: () => onChange(true) } },
      { label: 'Non', nativeInputProps: { value: 'non', checked: value === false, onChange: () => onChange(false) } },
    ]}
  />
)

const SECONDARY_RESIDENCES_OPTIONS: Array<{ value: TAmfSecondaryResidences; label: string }> = [
  { value: 'neutre', label: "Ce n'est pas un sujet" },
  { value: 'reguler', label: 'Je souhaite les réguler' },
  { value: 'developper', label: 'Je souhaite les développer' },
]

export const AmfSecondaryResidencesStep: FC<ChoiceStepProps<TAmfSecondaryResidences>> = ({ value, onChange }) => (
  <RadioButtons
    legend={<h2 className={fr.cx('fr-mb-0')}>Quel est votre point de vue sur les résidences secondaires sur votre territoire ?</h2>}
    name="amf-secondary-residences"
    options={SECONDARY_RESIDENCES_OPTIONS.map((option) => ({
      label: option.label,
      nativeInputProps: { value: option.value, checked: value === option.value, onChange: () => onChange(option.value) },
    }))}
  />
)

type AmfEmailStepProps = {
  value: string
  onChange: (value: string) => void
  error: string | null
}

export const AmfEmailStep: FC<AmfEmailStepProps> = ({ value, onChange, error }) => (
  <>
    <h2>Votre e-mail</h2>
    <Input
      label="Adresse e-mail (obligatoire pour voir les résultats)"
      hintText={
        <>
          Votre e-mail sera utilisé par l&apos;équipe Otelo pour vous recontacter au sujet de votre besoin en logement.{' '}
          <Link href="/donnees-personnelles" target="_blank">
            Données personnelles
          </Link>
        </>
      }
      state={error ? 'error' : 'default'}
      stateRelatedMessage={error ?? undefined}
      nativeInputProps={{
        type: 'email',
        name: 'email',
        autoComplete: 'email',
        required: true,
        value,
        onChange: (event) => onChange(event.target.value),
      }}
    />
  </>
)
