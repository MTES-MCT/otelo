'use client'

import { fr } from '@codegouvfr/react-dsfr'
import Alert from '@codegouvfr/react-dsfr/Alert'
import { FC } from 'react'
import { AmfShareForm } from '~/components/amf/amf-share-form'
import { formatNumber } from '~/components/amf/amf-steps'
import { TAmfResult } from '~/components/amf/amf-types'
import styles from './amf.module.css'

type AmfResultsProps = {
  result: TAmfResult
  leadId: string
}

/** Signe d'une contribution : « + » pour une valeur positive ou nulle, « − » sinon. */
const signOf = (value: number) => (value < 0 ? '−' : '+')

export const AmfResults: FC<AmfResultsProps> = ({ result, leadId }) => {
  const { total, annualAverage, horizon, baseYear, peakYear, blocks } = result
  // Le moteur ne compte les besoins que jusqu'au pic de ménages ; un pic à l'année de base signale un territoire déjà en baisse.
  const isAlreadyDeclining = peakYear !== null && peakYear <= baseYear
  const hasPeakBeforeHorizon = peakYear !== null && peakYear > baseYear

  const lines = blocks
    ? [
        { symbol: '=', label: 'Évolution de la population', value: blocks.population, signed: false },
        { symbol: signOf(blocks.vacancy), label: 'Logements vacants', value: blocks.vacancy, signed: true },
        { symbol: signOf(blocks.secondaryResidences), label: 'Résidences secondaires', value: blocks.secondaryResidences, signed: true },
        { symbol: signOf(blocks.badHousing), label: 'Résorption du mal-logement', value: blocks.badHousing, signed: true },
      ]
    : []

  return (
    <>
      <h1 className={fr.cx('fr-h3')}>Votre besoin en logements</h1>

      <div className={styles.total}>
        <p className={fr.cx('fr-display--sm', 'fr-mb-1v')}>{formatNumber(total)}</p>
        <p className={fr.cx('fr-text--lead', 'fr-mb-1v')}>
          {total > 1 ? 'logements' : 'logement'} à construire d&apos;ici {horizon}
        </p>
        {blocks && (
          <p className={fr.cx('fr-mb-0')}>
            soit environ {formatNumber(annualAverage)} par an{hasPeakBeforeHorizon && <> jusqu&apos;en {peakYear}</>}
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
                {line.symbol}
              </span>
              <span className={styles.label}>{line.label}</span>
              <span className={styles.value}>
                {/* Le signe porté par le symbole n'est pas vocalisé : on le restitue pour les lecteurs d'écran. */}
                {line.signed && <span className={fr.cx('fr-sr-only')}>{line.value < 0 ? 'moins ' : 'plus '}</span>}
                {formatNumber(line.signed ? Math.abs(line.value) : line.value)}
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
        Ces premiers chiffres ne sont pas encore précis. Invitez votre chef de service habitat à les affiner dans Otelo pour définir un
        scénario pleinement pertinent pour votre territoire.
      </p>

      <AmfShareForm leadId={leadId} />
    </>
  )
}
