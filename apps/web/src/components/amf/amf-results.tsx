'use client'

import { fr } from '@codegouvfr/react-dsfr'
import CallOut from '@codegouvfr/react-dsfr/CallOut'
import { FC } from 'react'
import { AmfShareForm } from '~/components/amf/amf-share-form'
import { formatNumber } from '~/components/amf/amf-steps'
import { TAmfRange, TAmfResult } from '~/components/amf/amf-types'
import styles from './amf.module.css'

type AmfResultsProps = {
  result: TAmfResult
  epciName: string
  leadId: string
}

/** « entre 200 et 300 », « jusqu'à 300 » (borne basse nulle) ou « 300 », sur la valeur absolue des bornes. */
const formatRange = (range: TAmfRange) => {
  const low = Math.min(Math.abs(range.min), Math.abs(range.max))
  const high = Math.max(Math.abs(range.min), Math.abs(range.max))
  if (low === high) return formatNumber(high)
  // Une fourchette de part et d'autre de 0 ne retient que sa partie positive.
  if (range.min < 0 && range.max > 0) return `jusqu'à ${formatNumber(range.max)}`
  if (low === 0) return `jusqu'à ${formatNumber(high)}`
  return `entre ${formatNumber(low)} et ${formatNumber(high)}`
}

type Line = { label: string; value: string }

const ContributionList: FC<{ lines: Line[]; symbol: '+' | '−'; srPrefix: string }> = ({ lines, symbol, srPrefix }) => (
  <ul className={styles.blocks}>
    {lines.map((line) => (
      <li key={line.label} className={styles.block}>
        <span className={styles.symbol} aria-hidden="true">
          {symbol}
        </span>
        <span className={styles.label}>{line.label}</span>
        <span className={styles.value}>
          {/* Le signe porté par le symbole n'est pas vocalisé : on le restitue pour les lecteurs d'écran. */}
          <span className={fr.cx('fr-sr-only')}>{srPrefix}</span>
          {line.value}
        </span>
      </li>
    ))}
  </ul>
)

const NoNeedResult: FC<{ horizon: number }> = ({ horizon }) => (
  <>
    <h1 className={fr.cx('fr-h3')}>Votre besoin en logements</h1>

    <div className={styles.total}>
      <p className={fr.cx('fr-display--sm', 'fr-mb-1v')}>Aucun</p>
      <p className={fr.cx('fr-text--lead', 'fr-mb-1v')}>besoin supplémentaire identifié d&apos;ici {horizon}</p>
      <p className={fr.cx('fr-text--sm', 'fr-mb-0')}>À l&apos;échelle de votre intercommunalité, selon les hypothèses retenues</p>
    </div>

    <h2 className={fr.cx('fr-h5', 'fr-mt-4w')}>Comment comprendre ce résultat ?</h2>
    <p>
      Selon les évolutions démographiques et les hypothèses retenues sur le parc existant, l&apos;estimation ne fait pas apparaître de
      besoin net de logements supplémentaires d&apos;ici {horizon}.
    </p>
    <p>
      <strong>Cela ne signifie pas qu&apos;il ne faut plus construire !</strong> Des besoins peuvent subsister dans certaines communes ou
      pour remplacer des logements démolis ou devenus inhabitables.
    </p>

    <h2 className={fr.cx('fr-h5')}>Une première estimation à approfondir</h2>
    <p>
      Ce résultat constitue un point de départ. D&apos;autres facteurs, notamment les évolutions du parc existant, peuvent modifier les
      besoins. Échangez avec votre intercommunalité ou les services de votre collectivité pour affiner cette estimation dans Otelo.
    </p>
  </>
)

export const AmfResults: FC<AmfResultsProps> = ({ result, epciName, leadId }) => {
  const { annual, contributions, baseYear, horizon } = result

  if (!annual || !contributions) {
    return (
      <>
        <NoNeedResult horizon={horizon} />
        <AmfShareForm leadId={leadId} />
      </>
    )
  }

  const { households, badHousing, fluidity, vacancyRemobilised, secondaryResidences } = contributions
  const perYear = (range: TAmfRange) => `${formatRange(range)} par an`
  const fewerPerYear = (range: TAmfRange) => `${formatRange(range)} par an en moins à construire`

  const needs: Line[] = [
    ...(households && households.max > 0 ? [{ label: "L'évolution du nombre de ménages", value: perYear(households) }] : []),
    ...(badHousing ? [{ label: 'Mieux loger les personnes qui en ont déjà besoin', value: perYear(badHousing) }] : []),
    ...(fluidity
      ? [{ label: 'Garder des logements disponibles pour faciliter les déménagements', value: `${formatNumber(fluidity)} par an` }]
      : []),
    ...(secondaryResidences && secondaryResidences.max > 0
      ? [{ label: "L'évolution des résidences secondaires", value: perYear(secondaryResidences) }]
      : []),
  ]

  const existingStock: Line[] = [
    ...(households && households.max <= 0
      ? [{ label: 'La baisse du nombre de ménages libère des logements', value: fewerPerYear(households) }]
      : []),
    ...(vacancyRemobilised ? [{ label: 'Remettre en occupation des logements vacants', value: fewerPerYear(vacancyRemobilised) }] : []),
    ...(secondaryResidences && secondaryResidences.max <= 0
      ? [{ label: "Transformer des résidences secondaires en logements occupés à l'année", value: fewerPerYear(secondaryResidences) }]
      : []),
  ]

  return (
    <>
      <h1 className={fr.cx('fr-h3')}>Combien de logements pour votre territoire ?</h1>

      <div className={styles.total}>
        <p className={fr.cx('fr-display--sm', 'fr-mb-1v')}>
          {annual.min === annual.max
            ? formatNumber(annual.max)
            : `${annual.min === 0 ? 'Jusqu’à' : `Entre ${formatNumber(annual.min)} et`} ${formatNumber(annual.max)}`}
        </p>
        <p className={fr.cx('fr-text--lead', 'fr-mb-1v')}>logements à construire par an</p>
        <p className={fr.cx('fr-mb-0')}>
          Une première estimation pour {epciName}, sur la période {baseYear}–{horizon}.
        </p>
      </div>

      <h2 className={fr.cx('fr-h5', 'fr-mt-4w')}>Qu&apos;est-ce qui explique ces besoins ?</h2>
      <p className={fr.cx('fr-mb-0')}>Pour répondre aux besoins des habitants :</p>
      <ContributionList lines={needs} symbol="+" srPrefix="en plus : " />

      {existingStock.length > 0 ? (
        <>
          <p className={fr.cx('fr-mt-3w', 'fr-mb-0')}>Le parc existant peut aussi répondre à une partie des besoins :</p>
          <ContributionList lines={existingStock} symbol="−" srPrefix="en moins : " />
        </>
      ) : (
        <p className={fr.cx('fr-mt-3w')}>
          D&apos;après votre premier paramétrage, l&apos;ensemble du besoin en logements supplémentaires passera par de la construction
          neuve.
        </p>
      )}

      <CallOut className={fr.cx('fr-mt-4w')} title="Un autre facteur à prendre en compte" titleAs="h3">
        Des logements peuvent être démolis, tandis que d&apos;autres peuvent être créés en divisant des logements ou en transformant des
        bâtiments existants. Ces évolutions peuvent aussi modifier le nombre de logements à construire. Elles méritent d&apos;être étudiées
        plus précisément à l&apos;échelle de votre territoire.
      </CallOut>

      <h2 className={fr.cx('fr-h5')}>Et maintenant ?</h2>
      <p>
        Cette première estimation est un point de départ pour réfléchir aux besoins en logements de votre territoire. Partagez-la avec votre
        intercommunalité ou les services de votre collectivité pour approfondir l&apos;analyse et construire un scénario adapté à votre
        territoire dans Otelo.
      </p>

      <AmfShareForm leadId={leadId} />
    </>
  )
}
