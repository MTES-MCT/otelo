import { fr } from '@codegouvfr/react-dsfr'
import Alert from '@codegouvfr/react-dsfr/Alert'
import { SelectInadequationFinanciereCategories } from '~/components/simulations/settings/modification/mal-logement/inadequation-financiere/select-inadequation-financiere-categories'
import { SelectInadequationFinancierePart } from '~/components/simulations/settings/modification/mal-logement/inadequation-financiere/select-inadequation-financiere-part'
import { SelectMaxEffortPart } from '~/components/simulations/settings/modification/mal-logement/inadequation-financiere/select-max-effort-part'
import { UpdateBadHousingSimulationForm } from '~/components/simulations/settings/modification/mal-logement/update-bad-housing-simulation-form'
import { NextStepLinkWithoutValidation } from '~/components/simulations/settings/next-step-link'
import type { SimulationPageProps } from '~/types/simulation-page-props'
import styles from './inadequation-financiere.module.css'

export default async function FinancialInadequationPage({ params }: SimulationPageProps) {
  const { id } = await params
  const href = `/simulation/${id}/modifier/mal-logement/mauvaise-qualite`

  return (
    <div className={styles.container}>
      <h5>Taux d&apos;effort maximal (rapport entre le loyer et le revenu des ménages)</h5>
      <Alert
        severity="info"
        description={
          <>
            <p>
              Le volume de ménages en situation d&apos;inadéquation financière sera d&apos;autant plus élevé que le taux d&apos;effort
              maximal sera faible. Il est usuel de considérer un seuil de 30%.
            </p>
            <p>
              Pour mémoire, le taux d&apos;effort correspond à la proportion du revenu d&apos;un ménage qu&apos;il consacre à se loger. Un
              ménage percevant 1500€/mois, payant 600€ de loyer et recevant 100€ d&apos;APL aura un taux d&apos;effort de
              (600€-100€)/(1500€) = 31,1%.
            </p>
          </>
        }
        small
      />
      <SelectMaxEffortPart />
      <h5>Catégories prises en compte</h5>
      <SelectInadequationFinanciereCategories />
      <h5>Part de logements réalloués aux autres ménages dont les revenus sont plus adaptés au logement</h5>
      <Alert
        severity="info"
        description={
          <>
            <p>
              Une situation d’inadéquation financière n’implique pas nécessairement un besoin en nouveaux logements, dans la mesure où une
              partie des logements concernés par l’inadéquation peut être réallouée à d’autres ménages. Plus la part de logements réalloués
              est élevée, plus le besoin en logement lié à l&apos;inadéquation financière est faible.
            </p>
            <p>Par défaut elle s&apos;élève à 90%.</p>
          </>
        }
        small
      />
      <SelectInadequationFinancierePart />
      <div className="fr-flex fr-flex-gap-2v fr-my-1w">
        <div className={fr.cx('fr-ml-auto')}>
          <NextStepLinkWithoutValidation href={href} />
        </div>
        <UpdateBadHousingSimulationForm />
      </div>
    </div>
  )
}
