'use client'

import { ACTIVATION_STEP_LABELS, type TActivationStep } from '@shared'
import classNames from 'classnames'
import type { FC } from 'react'
import styles from '~/app/(authenticated)/admin/admin.module.css'
import { ADMIN_CARD, ADMIN_CARD_HEADER } from '~/components/admin/shared/admin-classes'
import { chartColor } from '~/components/admin/shared/admin-colors'
import { ExportCsvButton } from '~/components/admin/shared/export-csv-button'
import funnelStyles from './activation-funnel.module.css'

type ActivationFunnelProps = {
  funnel?: TActivationStep[]
  isLoading?: boolean
}

// La largeur des barres est rapportée au premier palier (l'inscription), pas au palier
// précédent : l'export et le partage sont deux issues parallèles du premier scénario.
export const ActivationFunnel: FC<ActivationFunnelProps> = ({ funnel, isLoading }) => {
  const total = funnel?.[0]?.count ?? 0

  return (
    <div className={ADMIN_CARD}>
      <div className={ADMIN_CARD_HEADER}>
        <div>
          <h3 className={classNames('fr-m-0', styles.cardTitle)}>Entonnoir d'activation</h3>
          <p className="fr-text--xs fr-text-mention--grey fr-mb-0 fr-mt-1v">
            Cohorte des comptes créés sur la période, suivis jusqu'à leur premier partage.
          </p>
        </div>
        <ExportCsvButton dataset="activation" label="CSV" priority="tertiary" />
      </div>

      <div className="fr-p-3w">
        {isLoading ? (
          <p className="fr-text--sm fr-text-mention--grey fr-mb-0">Chargement…</p>
        ) : !funnel?.length || total === 0 ? (
          <p className="fr-text--sm fr-text-mention--grey fr-mb-0">Aucun compte créé sur cette période.</p>
        ) : (
          <ol className={classNames('fr-flex fr-direction-column fr-flex-gap-4v fr-m-0 fr-p-0', funnelStyles.steps)}>
            {funnel.map((step, index) => (
              <li className="fr-flex fr-direction-column fr-flex-gap-1v" key={step.step}>
                <div className="fr-flex fr-align-items-baseline fr-justify-content-space-between fr-flex-gap-4v">
                  <span className="fr-text--sm fr-text--bold">{step.label}</span>
                  <span className="fr-text--sm">{step.count.toLocaleString('fr-FR')}</span>
                </div>
                <div className={classNames('fr-background-contrast--grey', funnelStyles.barTrack)}>
                  <div
                    className={funnelStyles.barFill}
                    style={{ backgroundColor: chartColor(index), width: `${Math.min(100, (step.count / total) * 100)}%` }}
                  />
                </div>
                <div className="fr-flex fr-flex-wrap fr-flex-gap-4v fr-text--xs fr-text-mention--grey">
                  {step.conversionFrom !== null && step.comparedToStep && (
                    <span>
                      {step.conversionFrom} % depuis « {ACTIVATION_STEP_LABELS[step.comparedToStep]} »
                    </span>
                  )}
                  {step.medianDaysFrom !== null && <span>délai médian : {step.medianDaysFrom} j</span>}
                </div>
              </li>
            ))}
          </ol>
        )}
      </div>
    </div>
  )
}
