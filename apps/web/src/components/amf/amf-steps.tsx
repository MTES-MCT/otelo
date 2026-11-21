'use client'

import { fr } from '@codegouvfr/react-dsfr'
import Alert from '@codegouvfr/react-dsfr/Alert'
import CallOut from '@codegouvfr/react-dsfr/CallOut'
import { RadioButtons } from '@codegouvfr/react-dsfr/RadioButtons'
import Link from 'next/link'
import { FC, ReactNode, useRef, useState } from 'react'
import { TAmfCommune, TAmfDemography, TAmfEpci, TAmfSecondaryResidences, TAmfVacancy } from '~/components/amf/amf-types'
import { AutocompleteInput } from '~/components/simulations/autocomplete/autocomplete-input'
import { GeoApiCommuneResult, GeoApiEpciResult } from '~/hooks/use-geoapi-search'
import styles from './amf.module.css'

const numberFormatter = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 })

export const formatNumber = (value: number): string => numberFormatter.format(value)

export const AmfIntroStep: FC = () => (
  <>
    <h1 className={fr.cx('fr-h2')}>Quels besoins en logements d&apos;ici 2036&nbsp;?</h1>
    <p className={fr.cx('fr-text--lead')}>Découvrez une première estimation à l&apos;échelle de votre intercommunalité.</p>
  </>
)

/** Volume approché pour l'affichage (« ~1 200 ») : à l'unité sous 100, à deux chiffres significatifs au-delà. */
export const formatApproximate = (value: number): string => {
  if (Math.abs(value) < 100) {
    return numberFormatter.format(value)
  }
  return numberFormatter.format(Number(value.toPrecision(2)))
}

const percentFormatter = new Intl.NumberFormat('fr-FR', { style: 'percent', maximumFractionDigits: 1 })
const signedPercentFormatter = new Intl.NumberFormat('fr-FR', { style: 'percent', maximumFractionDigits: 1, signDisplay: 'exceptZero' })

type EpciLookupState = { status: 'idle' } | { status: 'loading' } | { status: 'not-covered' } | { status: 'error' }

type AmfEpciStepProps = {
  epci: TAmfEpci | null
  commune: TAmfCommune | null
  onChange: (epci: TAmfEpci | null, commune: TAmfCommune | null) => void
}

export const AmfEpciStep: FC<AmfEpciStepProps> = ({ epci, commune, onChange }) => {
  const [lookup, setLookup] = useState<EpciLookupState>({ status: 'idle' })
  // Seule la dernière sélection compte : une réponse plus lente d'un choix précédent est ignorée.
  const lastRequest = useRef(0)

  const handleSelect = async (item: GeoApiEpciResult | GeoApiCommuneResult) => {
    // Une commune porte l'EPCI auquel elle appartient ; sans EPCI, elle est ignorée.
    const isEpci = 'codesRegions' in item
    const epciCode = isEpci ? item.code : item.codeEpci
    if (!epciCode) {
      return
    }
    const selectedCommune = isEpci ? null : { name: item.nom, population: item.population ?? null }

    const requestId = ++lastRequest.current
    onChange(null, null)
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
      onChange(body, selectedCommune)
      setLookup({ status: 'idle' })
    } catch {
      if (requestId === lastRequest.current) {
        setLookup({ status: 'error' })
      }
    }
  }

  const communeShare = commune?.population != null && epci?.population ? Math.min(commune.population / epci.population, 1) : null

  return (
    <>
      <h2>Renseignez votre territoire</h2>
      <AutocompleteInput
        label="Nom de votre commune ou de votre EPCI"
        hintText="Saisissez au moins 3 caractères, puis choisissez dans la liste. Vous pouvez également rechercher directement votre intercommunalité."
        defaultValue={commune?.name ?? epci?.name}
        onClick={handleSelect}
        communesFirst
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
            <p className={fr.cx('fr-mb-1w')}>
              Votre territoire est : <strong>{commune?.name ?? epci.name}</strong>
            </p>
            {commune && (
              <p className={fr.cx('fr-mb-2w')}>
                Votre commune appartient à l&apos;intercommunalité <strong>{epci.name}</strong>.
              </p>
            )}

            <dl className={styles.figures}>
              {epci.population !== null && (
                <div className={styles.figure}>
                  <dt>Population de l&apos;EPCI</dt>
                  <dd>{formatNumber(epci.population)} habitants</dd>
                </div>
              )}
              {epci.recentEvolution && (
                <div className={styles.figure}>
                  <dt>
                    Évolution récente ({epci.recentEvolution.fromYear}–{epci.recentEvolution.toYear})
                  </dt>
                  <dd>{signedPercentFormatter.format(epci.recentEvolution.rate).replace('-', '−')}</dd>
                </div>
              )}
              {communeShare !== null && (
                <div className={styles.figure}>
                  <dt>Part de la commune dans l&apos;EPCI</dt>
                  <dd>{percentFormatter.format(communeShare)}</dd>
                </div>
              )}
            </dl>

            <p className={fr.cx('fr-mt-2w', 'fr-mb-2w')}>
              L&apos;estimation portera sur l&apos;ensemble de cette intercommunalité.
              {commune && (
                <>
                  {' '}
                  <strong>Elle ne constitue pas un objectif de construction pour votre seule commune.</strong>
                </>
              )}
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

const DidYouKnow: FC<{ children: ReactNode }> = ({ children }) => (
  <CallOut className={fr.cx('fr-mt-3w', 'fr-mb-0')} title="Le saviez-vous ?" titleAs="h3">
    {children}
  </CallOut>
)

/** Encarts « Le saviez-vous ? » sur la démographie et la vacance, affichés en fin de résultats. */
export const AmfDidYouKnow: FC = () => (
  <>
    <DidYouKnow>
      Même à population identique, le nombre de logements nécessaires peut varier : vieillissement, séparation des couples ou départ des
      jeunes du domicile familial modifient le nombre de personnes vivant dans chaque logement.
      <br />
      Pour chaque hypothèse de population, Otelo calcule un besoin compris entre une évolution tendancielle et une évolution accélérée des
      modes de cohabitation.
    </DidYouKnow>
    <DidYouKnow>
      Tous les logements vacants ne sont pas facilement mobilisables. Selon l&apos;ampleur de leur remise en occupation, les besoins en
      construction neuve peuvent être plus ou moins importants.
      <br />
      En parallèle d&apos;Otelo, la DGALN met à votre disposition{' '}
      <a href="https://zerologementvacant.beta.gouv.fr" target="_blank" rel="noopener noreferrer">
        Zéro Logement Vacant
      </a>
      , un outil gratuit pour identifier les logements vacants, contacter leurs propriétaires et faciliter leur remise sur le marché.
    </DidYouKnow>
  </>
)

type AmfDemographyStepProps = ChoiceStepProps<TAmfDemography> & { epci: TAmfEpci }

export const AmfDemographyStep: FC<AmfDemographyStepProps> = ({ epci, value, onChange }) => {
  const { haute, central, basse } = epci.projectedPopulation
  const options: Array<{ value: TAmfDemography; label: string }> = [
    // Sans projection basse pour ce territoire, l'hypothèse n'est pas proposée.
    ...(basse === null ? [] : [{ value: 'moins' as const, label: `Hypothèse basse : ${formatNumber(basse)} habitants` }]),
    { value: 'tendance', label: `Hypothèse centrale : ${formatNumber(central)} habitants` },
    { value: 'plus', label: `Hypothèse haute : ${formatNumber(haute)} habitants` },
  ]

  return (
    <RadioButtons
      legend={
        <h2 className={fr.cx('fr-mb-2w')}>
          <strong>D&apos;ici {epci.horizon},</strong> quelle évolution <strong>souhaitez-vous retenir</strong> sur votre territoire&nbsp;?
        </h2>
      }
      name="amf-demography"
      options={options.map((option) => ({
        label: option.label,
        nativeInputProps: { value: option.value, checked: value === option.value, onChange: () => onChange(option.value) },
      }))}
    />
  )
}

const VACANCY_OPTIONS: Array<{ value: TAmfVacancy; label: string }> = [
  { value: 'prioritaire', label: "Oui, c'est prioritaire." },
  { value: 'parmi-autres', label: "Oui, parmi d'autres mesures." },
  {
    value: 'non',
    label: 'Non, la remobilisation de ces logements me paraît difficile (logements vétustes, inadaptés aux besoins, mal situés…).',
  },
]

type AmfVacancyStepProps = ChoiceStepProps<TAmfVacancy> & { epci: TAmfEpci }

export const AmfVacancyStep: FC<AmfVacancyStepProps> = ({ epci, value, onChange }) => (
  <RadioButtons
    legend={
      <h2 className={fr.cx('fr-mb-2w')}>
        La remobilisation des logements vacants constitue-t-elle une priorité de votre politique locale de l&apos;habitat ?
      </h2>
    }
    hintText={
      epci.longTermVacancy
        ? `D'après les données disponibles, votre intercommunalité compte environ ${formatApproximate(epci.longTermVacancy.count)} logements vacants depuis au moins deux ans, en ${epci.longTermVacancy.year} (Fichiers fonciers ${epci.longTermVacancy.year}).`
        : undefined
    }
    name="amf-vacancy"
    options={VACANCY_OPTIONS.map((option) => ({
      label: option.label,
      nativeInputProps: { value: option.value, checked: value === option.value, onChange: () => onChange(option.value) },
    }))}
  />
)

const SECONDARY_RESIDENCES_OPTIONS: Array<{ value: TAmfSecondaryResidences; label: string }> = [
  { value: 'hausse', label: 'Un développement qui se poursuit : les résidences secondaires sont de plus en plus nombreuses.' },
  { value: 'stable', label: "Leur évolution n'impactera pas le besoin en logements." },
  { value: 'maitrise', label: 'Leur développement sera régulé.' },
  { value: 'recuperation', label: "Une partie des résidences secondaires doit redevenir des logements occupés à l'année." },
]

type AmfSecondaryResidencesStepProps = ChoiceStepProps<TAmfSecondaryResidences> & { epci: TAmfEpci }

export const AmfSecondaryResidencesStep: FC<AmfSecondaryResidencesStepProps> = ({ epci, value, onChange }) => (
  <RadioButtons
    legend={
      <h2 className={fr.cx('fr-mb-2w')}>
        D&apos;ici {epci.horizon}, quels enjeux représentent les résidences secondaires sur votre territoire ?
      </h2>
    }
    hintText={
      epci.secondaryResidencesCount !== null
        ? `Votre intercommunalité compte aujourd'hui environ ${formatApproximate(epci.secondaryResidencesCount)} résidences secondaires, soit ${percentFormatter.format(epci.secondaryResidencesShare)} de ses logements.`
        : `Elles représentent aujourd'hui ${percentFormatter.format(epci.secondaryResidencesShare)} des logements de votre intercommunalité.`
    }
    name="amf-secondary-residences"
    options={SECONDARY_RESIDENCES_OPTIONS.map((option) => ({
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
  <>
    <h2>Et les habitants en situation de mal-logement&nbsp;?</h2>
    <p>
      Certains habitants n&apos;ont pas de logement personnel ou vivent dans un logement trop petit ou dégradé. Otelo tient aussi compte des
      besoins de ces habitants dans votre estimation.
    </p>
    <RadioButtons
      legend="Souhaitez-vous considérer le mal-logement dans l'estimation du besoin en logements ?"
      name="amf-bad-housing"
      options={[
        { label: 'Oui', nativeInputProps: { value: 'oui', checked: value === true, onChange: () => onChange(true) } },
        { label: 'Non', nativeInputProps: { value: 'non', checked: value === false, onChange: () => onChange(false) } },
      ]}
    />
  </>
)
