'use client'

import { fr } from '@codegouvfr/react-dsfr'
import { ACTIVATION_STEP_LABELS, type TActivationStep } from '@shared'
import type { FC } from 'react'
import styles from '~/app/(authenticated)/admin/admin.module.css'
import { chartColor } from '~/components/admin/shared/admin-colors'
import { ExportCsvButton } from '~/components/admin/shared/export-csv-button'
import funnelStyles from './activation-funnel.module.css'

type ActivationFunnelProps = {
  funnel?: TActivationStep[]
  isLoading?: boolean
}

/**
 * Entonnoir d'activation.
 *
 * La largeur des barres est rapportée au premier palier (l'inscription), pas au palier
 * précédent : l'export et le partage sont deux issues parallèles du premier scénario,
 * et les enchaîner donnerait des barres incohérentes.
 */
export const ActivationFunnel: FC<ActivationFunnelProps> = ({ funnel, isLoading }) => {
  const total = funnel?.[0]?.count ?? 0

  return (
    <div className={styles.card}>
      <div className={styles.cardHeader}>
        <div>
          <h3 className={styles.cardTitle}>Entonnoir d'activation</h3>
          <p className="fr-text--xs fr-text-mention--grey fr-mb-0 fr-mt-1v">
            Cohorte des comptes créés sur la période, suivis jusqu'à leur premier partage.
          </p>
        </div>
        <ExportCsvButton dataset="activation" label="CSV" priority="tertiary" />
      </div>

      <div className={fr.cx('fr-p-3w')}>
        {isLoading ? (
          <p className="fr-text--sm fr-text-mention--grey fr-mb-0">Chargement…</p>
        ) : !funnel?.length || total === 0 ? (
          <p className="fr-text--sm fr-text-mention--grey fr-mb-0">Aucun compte créé sur cette période.</p>
        ) : (
          <ol className={funnelStyles.steps}>
            {funnel.map((step, index) => (
              <li className={funnelStyles.step} key={step.step}>
                <div className={funnelStyles.stepHeader}>
                  <span className="fr-text--sm fr-text--bold">{step.label}</span>
                  <span className="fr-text--sm">{step.count.toLocaleString('fr-FR')}</span>
                </div>
                <div className={funnelStyles.barTrack}>
                  <div
                    className={funnelStyles.barFill}
                    style={{ backgroundColor: chartColor(index), width: `${Math.min(100, (step.count / total) * 100)}%` }}
                  />
                </div>
                <div className={funnelStyles.stepMeta}>
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
