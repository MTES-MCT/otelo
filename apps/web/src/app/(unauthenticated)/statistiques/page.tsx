import AccesCollectivitesImg from '@assets/img/acces_collectivite.png'
import OteloDdtImg from '@assets/img/acces_ddt.png'
import { fr } from '@codegouvfr/react-dsfr'
import classNames from 'classnames'
import type { Metadata } from 'next'
import Image from 'next/image'
import styles from './statistiques.module.css'

export const metadata: Metadata = {
  title: "Statistiques de l'application Otelo",
}

export default function StatistiquesPage() {
  return (
    <>
      <section className={fr.cx('fr-container', 'fr-mb-8v')}>
        <h1>Statistiques</h1>

        <div className={fr.cx('fr-grid-row', 'fr-grid-row--gutters')}>
          <div className={classNames(fr.cx('fr-col-12', 'fr-col-md-8'), styles.section1)}>
            <div className={classNames(styles.cardStat)}>
              <h6 className={fr.cx('fr-mb-2v')}>Départements utilisant Otelo</h6>
              <div className={classNames(fr.cx('fr-card--shadow'), styles.cardStatContent)}>
                <Image
                  src={OteloDdtImg}
                  alt="Carte des DDT utilisant Otelo en juin 2025"
                  className={fr.cx('fr-mb-1v')}
                  style={{ maxWidth: '100%', height: 'auto' }}
                />
                <Image
                  src={AccesCollectivitesImg}
                  alt="Carte des collectivités ayant accès à Otelo en juin 2025"
                  className={fr.cx('fr-mb-1v')}
                  style={{ maxWidth: '100%', height: 'auto' }}
                />
              </div>
            </div>
          </div>
          <div className={classNames(fr.cx('fr-col-12', 'fr-col-md-4'), styles.cardStatContainer)}>
            <StatCard title="Nombre de DDT (départements) engagées" stat="82/89" metric="ddt engagées" />
            <StatCard title="Nombre de scénarios réalisés par l'utilisateur" stat="2,5" metric="scénarios / utilisateur 'déployé'" />
            <StatCard title="Nombre de territoires (EPCI ou bassins d'habitat) utilisateurs d'Otelo" stat="220" metric="territoires" />
            <StatCard title="NPS utilisateurs déployés (territoires / agences / bureaux d'étude)" stat="57%" />
          </div>
        </div>
      </section>
      <div className={fr.cx('fr-container')}>
        <div className={fr.cx('fr-grid-row', 'fr-grid-row--gutters')} style={{ minHeight: '320px' }}>
          <div className={fr.cx('fr-col-12', 'fr-col-md-4')}>
            <StatCard title="Volume total d'engagement de remobilisation de logements vacants au cours des 12 derniers mois" stat="7.500" />
          </div>
          <div className={fr.cx('fr-col-12', 'fr-col-md-4')}>
            <StatCard title="Volume total d'engagement de lutte contre le mal logement au cours des 12 derniers mois" stat="14.000" />
          </div>
          <div className={fr.cx('fr-col-12', 'fr-col-md-4')}>
            <StatCard title="Ecart entre les prévisions initiales de constructions (volonté des élus) vs. fin de parcours" stat="-10.000" />
          </div>
        </div>
      </div>
    </>
  )
}

type StatCardProps = {
  title: string
  stat: string
  metric?: string
}

const StatCard = ({ title, stat, metric }: StatCardProps) => {
  return (
    <div className={classNames(styles.cardStat)}>
      <h6 className={fr.cx('fr-mb-2v')}>{title}</h6>
      <div className={classNames(fr.cx('fr-card--shadow'), styles.cardStatContent)}>
        <strong className={styles.stat}>{stat}</strong>
        {metric && <span className={styles.metric}>{metric}</span>}
      </div>
    </div>
  )
}
