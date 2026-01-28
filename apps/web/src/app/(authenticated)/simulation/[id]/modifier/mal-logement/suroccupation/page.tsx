import { fr } from '@codegouvfr/react-dsfr'
import Alert from '@codegouvfr/react-dsfr/Alert'
import { SelectSuroccupationCategories } from '~/components/simulations/settings/modification/mal-logement/suroccupation /select-suroccupation-categories'
import { SelectSuroccupationLevel } from '~/components/simulations/settings/modification/mal-logement/suroccupation /select-suroccupation-level'
import { SelectSuroccupationPart } from '~/components/simulations/settings/modification/mal-logement/suroccupation /select-suroccupation-part'
import { SelectSuroccupationSource } from '~/components/simulations/settings/modification/mal-logement/suroccupation /select-suroccupation-source'
import { UpdateBadHousingSimulationForm } from '~/components/simulations/settings/modification/mal-logement/update-bad-housing-simulation-form'
import { NextStepLinkWithoutValidation } from '~/components/simulations/settings/next-step-link'
import type { SimulationPageProps } from '~/types/simulation-page-props'
import styles from './suroccupation.module.css'

export default async function SuroccupationPage({ params }: SimulationPageProps) {
  const { id } = await params
  const href = `/simulation/${id}/modifier/mal-logement/validation-parametrage`

  return (
    <div className={styles.container}>
      <h5>Niveaux de suroccupation</h5>
      <Alert
        severity="info"
        description={
          <>
            <p>
              Deux définitions coexistent pour mesurer le surpeuplement : celle de l’INSEE, fondée sur le nombre de pièces nécessaires selon
              la composition familiale, et celle du CGDD/SDES, qui repose sur la surface habitable par personne. Exemple : pour un couple
              avec deux enfants de plus de 7 ans est considéré en situation de suroccupation lourde si:
            </p>
            <ul>
              <li>
                CGDD/SDES : le logement fait moins de 36 m². Ils sont considérés en suroccupation légère si la surface est comprise entre 36
                et 49 m².
              </li>
              <li>INSEE : le logement est un T2 ou un studio (T3 pour la suroccupation modérée). </li>
            </ul>
          </>
        }
        small
      />
      <SelectSuroccupationSource />
      <SelectSuroccupationLevel />
      <h5>Catégories prises en compte</h5>
      <SelectSuroccupationCategories />
      <h5>Part de logements réalloués aux autres ménages dont la taille est plus adaptée aux logement</h5>
      <Alert
        severity="info"
        description={
          <>
            <p>
              Une situation d’inadéquation physique n’implique pas nécessairement un besoin en nouveaux logements, dans la mesure où une
              partie des logements concernés par l’inadéquation peut être réallouée à d’autres ménages plus petits. Plus la part de
              logements réalloués est élevée, plus le besoin en logement lié à l&apos;inadéquation physique est faible.
            </p>
            <p>Par défaut elle s&apos;élève à 90%.</p>
          </>
        }
        small
      />
      <SelectSuroccupationPart />
      <div className="fr-flex fr-flex-gap-2v fr-my-1w">
        <div className={fr.cx('fr-ml-auto')}>
          <NextStepLinkWithoutValidation href={href} />
        </div>
        <UpdateBadHousingSimulationForm />
      </div>
    </div>
  )
}
