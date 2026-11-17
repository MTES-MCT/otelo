'use client'

import { fr } from '@codegouvfr/react-dsfr'
import Alert from '@codegouvfr/react-dsfr/Alert'
import { FC } from 'react'
import { AmfShareForm } from '~/components/amf/amf-share-form'
import { formatNumber } from '~/components/amf/amf-steps'
import { TAmfRange, TAmfResult } from '~/components/amf/amf-types'
import styles from './amf.module.css'

type AmfResultsProps = {
  result: TAmfResult
  leadId: string
}

/** Signe d'une contribution : « − » pour une fourchette négative, « + » sinon. */
const isNegative = (range: TAmfRange) => range.min < 0

/** « moins de 50 » ou « 1 000 à 1 500 », sur la valeur absolue des bornes. */
const formatRange = (range: TAmfRange) => {
  const low = Math.min(Math.abs(range.min), Math.abs(range.max))
  const high = Math.max(Math.abs(range.min), Math.abs(range.max))
  return low === 0 ? `moins de ${formatNumber(high)}` : `${formatNumber(low)} à ${formatNumber(high)}`
}

const capitalize = (text: string) => text.charAt(0).toUpperCase() + text.slice(1)

export const AmfResults: FC<AmfResultsProps> = ({ result, leadId }) => {
  const { total, annualAverage, horizon, baseYear, peakYear, blocks } = result
  // Le moteur ne compte les besoins que jusqu'au pic de ménages ; un pic à l'année de base signale un territoire déjà en baisse.
  const isAlreadyDeclining = peakYear !== null && peakYear <= baseYear
  const hasPeakBeforeHorizon = peakYear !== null && peakYear > baseYear

  const lines = blocks
    ? [
        { label: 'Évolution de la population', range: blocks.population },
        { label: 'Logements vacants', range: blocks.vacancy },
        { label: 'Résidences secondaires', range: blocks.secondaryResidences },
        { label: 'Résorption du mal-logement', range: blocks.badHousing },
      ]
    : []

  return (
    <>
      <h1 className={fr.cx('fr-h3')}>Votre besoin en logements</h1>

      <div className={styles.total}>
        <p className={fr.cx('fr-display--sm', 'fr-mb-1v')}>{total ? capitalize(formatRange(total)) : 'Aucun'}</p>
        <p className={fr.cx('fr-text--lead', 'fr-mb-1v')}>
          {total ? 'logements' : 'logement'} à construire d&apos;ici {horizon}
        </p>
        {annualAverage && (
          <p className={fr.cx('fr-mb-0')}>
            soit {formatRange(annualAverage)} par an{hasPeakBeforeHorizon && <> jusqu&apos;en {peakYear}</>}
          </p>
        )}
      </div>

      {hasPeakBeforeHorizon && (
        <Alert
          className={fr.cx('fr-mt-3w')}
          severity="info"
          small
          description={
            <>
              Le nombre de foyers de votre territoire atteint son maximum en {peakYear}. Au-delà, il diminue&nbsp;: il n&apos;y a plus de
              besoin en logements supplémentaires, et une partie du mal-logement peut être résorbée dans le parc existant. Otelo permet
              d&apos;analyser cette situation en détail.
            </>
          }
        />
      )}

      {blocks ? (
        <ul className={styles.blocks}>
          {lines.map((line) => (
            <li key={line.label} className={styles.block}>
              <span className={styles.symbol} aria-hidden="true">
                {isNegative(line.range) ? '−' : '+'}
              </span>
              <span className={styles.label}>{line.label}</span>
              <span className={styles.value}>
                {/* Le signe porté par le symbole n'est pas vocalisé : on le restitue pour les lecteurs d'écran. */}
                <span className={fr.cx('fr-sr-only')}>{isNegative(line.range) ? 'en moins : ' : 'en plus : '}</span>
                {formatRange(line.range)}
              </span>
            </li>
          ))}
        </ul>
      ) : isAlreadyDeclining ? (
        <p className={fr.cx('fr-mt-3w')}>
          Le nombre de foyers de votre territoire diminue déjà&nbsp;: selon ces hypothèses, le parc actuel suffit à les loger d&apos;ici{' '}
          {horizon}, et vos choix sur les logements vacants, les résidences secondaires et le mal-logement n&apos;ajoutent pas de besoin en
          construction. Otelo permet à votre chef de service habitat d&apos;analyser cette situation en détail.
        </p>
      ) : (
        <p className={fr.cx('fr-mt-3w')}>
          Selon ces hypothèses, votre parc actuel couvre les besoins d&apos;ici {horizon}. Otelo peut aider votre chef de service habitat à
          travailler la qualité du parc et la remobilisation des logements.
        </p>
      )}

      <p className={fr.cx('fr-text--sm', 'fr-mt-3w')}>
        Ces fourchettes donnent un premier ordre de grandeur. Invitez votre chef de service habitat à les affiner dans Otelo pour définir un
        scénario pleinement pertinent pour votre territoire.
      </p>

      <AmfShareForm leadId={leadId} />
    </>
  )
}
