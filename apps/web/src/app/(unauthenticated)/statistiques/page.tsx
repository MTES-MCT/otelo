import { fr } from '@codegouvfr/react-dsfr'
import Alert from '@codegouvfr/react-dsfr/Alert'
import Button from '@codegouvfr/react-dsfr/Button'
import type { TPublicStatistics } from '@otelo/shared'
import type { Metadata } from 'next'
import { getPublicStatistics } from '~/server-only/statistics/get-public-statistics'
import { EpciList } from './_components/epci-list'
import { describeReduction, EPCI_STATUS_COLORS, EPCI_STATUS_LABELS, formatDay, formatInteger, plural } from './_components/format'
import { KeyFigures, SurveyFigure } from './_components/key-figures'
import { Methodology } from './_components/methodology'
import { MonthlyChart } from './_components/monthly-chart'
import { PlanningDocumentsChart } from './_components/planning-documents-chart'
import { PublicEpciMapWrapper } from './_components/public-epci-map-wrapper'
import { TargetReductions } from './_components/target-reductions'
import styles from './statistiques.module.css'

export const metadata: Metadata = {
  title: "Statistiques de l'application Otelo",
  description: "Usage d'Otelo par les territoires : EPCI utilisateurs, population couverte, documents d'urbanisme et DDT engagées.",
}

// Rendu à la requête : les données sont mises en cache une heure, rien n'est figé au build.
export const dynamic = 'force-dynamic'

function AccessCallToAction() {
  return (
    <section className={styles.cta} aria-labelledby="cta-title">
      <h2 id="cta-title" className={fr.cx('fr-h4')}>
        Votre territoire a un document d'urbanisme à préparer ?
      </h2>
      <p>Otelo est ouvert aux DDT, aux EPCI, aux agences d'urbanisme et aux bureaux d'études qui les accompagnent.</p>
      <Button linkProps={{ href: '/contact' }} iconId="fr-icon-arrow-right-line" iconPosition="right">
        Demander un accès
      </Button>
    </section>
  )
}

function HeadlineSentence({ targetReductions }: { targetReductions: TPublicStatistics['targetReductions'] }) {
  const vacancy = targetReductions.find((reduction) => reduction.domain === 'longTermVacancy')
  if (!vacancy || vacancy.median === null) return null
  return (
    <p className={styles.headline}>
      Dans les scénarios exportés, les territoires visent en médiane {describeReduction(vacancy.median)} du taux de vacance de longue durée
      ({formatInteger(vacancy.scenarios)} {plural(vacancy.scenarios, 'scénario', 'scénarios')}).
    </p>
  )
}

function MapLegend({ epcis }: { epcis: TPublicStatistics['epcis'] }) {
  const exported = epcis.filter((epci) => epci.status === 'EXPORTED').length
  const simulated = epcis.length - exported
  const items = [
    { color: EPCI_STATUS_COLORS.EXPORTED.fill, label: `Bleu foncé : ${EPCI_STATUS_LABELS.EXPORTED.toLowerCase()}`, count: exported },
    { color: EPCI_STATUS_COLORS.SIMULATED.fill, label: `Bleu clair : ${EPCI_STATUS_LABELS.SIMULATED.toLowerCase()}`, count: simulated },
    { color: '#CCCCCC', label: "Gris : n'utilise pas encore Otelo", count: null },
  ]
  return (
    <div>
      <h3 className={fr.cx('fr-h6')}>Légende</h3>
      <ul className={styles.legend}>
        {items.map((item) => (
          <li key={item.label}>
            <span className={styles.legendSwatch} style={{ backgroundColor: item.color }} aria-hidden="true" />
            <span>
              {item.label}
              {item.count !== null && ` (${formatInteger(item.count)} EPCI)`}
            </span>
          </li>
        ))}
      </ul>
      <p className={fr.cx('fr-text--sm')}>
        Survolez un EPCI pour afficher son nom, son département et son statut. Les boutons en bas à gauche de la carte recentrent la vue sur
        les territoires d'outre-mer.
      </p>
    </div>
  )
}

function Statistics({ statistics }: { statistics: TPublicStatistics }) {
  return (
    <>
      <HeadlineSentence targetReductions={statistics.targetReductions} />

      <section className={fr.cx('fr-mb-8v')} aria-labelledby="key-figures-title">
        <h2 id="key-figures-title" className="fr-sr-only">
          Chiffres clés
        </h2>
        <KeyFigures keyFigures={statistics.keyFigures} />
      </section>

      <section className={fr.cx('fr-mb-8v')} aria-labelledby="map-title">
        <h2 id="map-title">Les territoires qui utilisent Otelo</h2>
        <p>
          {formatInteger(statistics.epcis.length)} {plural(statistics.epcis.length, 'EPCI a déjà été étudié', 'EPCI ont déjà été étudiés')}{' '}
          avec Otelo, dont {formatInteger(statistics.keyFigures.epcisWithExport)} avec au moins un scénario exporté.
        </p>
        <div className={fr.cx('fr-grid-row', 'fr-grid-row--gutters')}>
          <div className={fr.cx('fr-col-12', 'fr-col-lg-8')}>
            <div className={styles.mapContainer}>
              <PublicEpciMapWrapper epcis={statistics.epcis} />
            </div>
          </div>
          <div className={fr.cx('fr-col-12', 'fr-col-lg-4')}>
            <MapLegend epcis={statistics.epcis} />
          </div>
        </div>
        <EpciList epcis={statistics.epcis} />
      </section>

      <section className={fr.cx('fr-mb-8v')} aria-labelledby="usage-title">
        <h2 id="usage-title">Un usage qui s'inscrit dans la durée</h2>
        <MonthlyChart monthly={statistics.monthly} />
      </section>

      <section className={fr.cx('fr-mb-8v')} aria-labelledby="documents-title">
        <h2 id="documents-title">Au service des documents d'urbanisme</h2>
        <PlanningDocumentsChart byType={statistics.planningDocumentsByType} />
      </section>

      {statistics.targetReductions.some((reduction) => reduction.median !== null) && (
        <section className={fr.cx('fr-mb-8v')} aria-labelledby="reductions-title">
          <h2 id="reductions-title">Des leviers au-delà de la construction neuve</h2>
          <p>Objectifs fixés par les territoires dans leurs scénarios exportés, en écart au taux observé.</p>
          <TargetReductions targetReductions={statistics.targetReductions} />
        </section>
      )}

      <section className={fr.cx('fr-mb-8v')} aria-labelledby="methodology-title">
        <h2 id="methodology-title">Méthode</h2>
        <Methodology />
      </section>
    </>
  )
}

export default async function StatistiquesPage() {
  const statistics = await getPublicStatistics()

  return (
    <div className={fr.cx('fr-container', 'fr-mb-8v')}>
      <h1 className={fr.cx('fr-mb-2v')}>Statistiques</h1>
      {statistics ? (
        <>
          <p className={fr.cx('fr-text--sm', 'fr-mb-4w')}>Mis à jour le {formatDay(statistics.generatedAt)}</p>
          <Statistics statistics={statistics} />
        </>
      ) : (
        <>
          <Alert
            className={fr.cx('fr-mb-4w')}
            severity="info"
            title="Statistiques momentanément indisponibles"
            description="Les chiffres d'usage d'Otelo ne peuvent pas être affichés pour le moment. Réessayez dans quelques minutes."
          />
          <ul className={styles.figures}>
            <li>
              <SurveyFigure />
            </li>
          </ul>
        </>
      )}
      <AccessCallToAction />
    </div>
  )
}
