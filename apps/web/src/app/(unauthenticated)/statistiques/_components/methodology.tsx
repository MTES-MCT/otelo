import { Accordion } from '@codegouvfr/react-dsfr/Accordion'
import { SURVEY_INFLUENCED_DOCUMENTS } from '~/constants/survey-statistics'
import { formatMonth } from '~/utils/format-statistics'

const COMMON =
  "Les comptes de l'équipe Otelo sont exclus de tous les indicateurs. Un scénario exporté puis supprimé reste compté : l'export a eu lieu."

/** Définition de chaque indicateur de la page. */
export function Methodology() {
  return (
    <div className="fr-accordions-group">
      <Accordion label="Principes communs">
        <p>{COMMON}</p>
        <p className="fr-mb-0">
          Les chiffres sont calculés à partir de la base de données d'Otelo, en cumul depuis le lancement de l'application, sauf l'évolution
          mensuelle. Les chiffres affichés datent d'une heure au plus.
        </p>
      </Accordion>
      <Accordion label="EPCI couverts par un scénario Otelo">
        <p>
          Un EPCI est couvert dès qu'il figure dans au moins un scénario exporté (PowerPoint ou Excel), quel qu'en soit l'auteur : c'est
          souvent la DDT, qui étudie l'ensemble des EPCI de son département. Être couvert ne signifie donc pas que l'EPCI utilise lui-même
          Otelo. Le nombre d'EPCI ayant fait l'objet d'au moins une simulation ne compte que les simulations non supprimées.
        </p>
        <p className="fr-mb-0">
          La carte et la liste montrent tous les EPCI étudiés avec Otelo, couverts ou non au sens ci-dessus. Un EPCI a le statut « scénario
          exporté » s'il figure dans un scénario exporté ; sinon, il est « étudié dans une simulation » s'il figure dans une simulation non
          supprimée. Un EPCI absent du fond de carte reste présent dans la liste.
        </p>
      </Accordion>
      <Accordion label="Habitants couverts">
        <p className="fr-mb-0">
          Population du dernier recensement disponible des EPCI couverts par un scénario Otelo. La part est rapportée à la population de
          l'ensemble des EPCI de France.
        </p>
      </Accordion>
      <Accordion label="Dossiers d'études pour un document d'urbanisme">
        <p className="fr-mb-0">
          Dossiers d'études dont l'utilisateur a déclaré qu'ils servent à un PLH ou PLUi-H, un SCoT ou un autre document d'urbanisme, et
          dont au moins un scénario a été exporté. Les dossiers déclarés hors document d'urbanisme ou sans réponse ne sont pas comptés.
        </p>
      </Accordion>
      <Accordion label="Documents d'urbanisme influencés">
        <p className="fr-mb-0">
          Chiffre déclaratif, distinct du précédent : {SURVEY_INFLUENCED_DOCUMENTS.source.charAt(0).toLowerCase()}
          {SURVEY_INFLUENCED_DOCUMENTS.source.slice(1)}, depuis {formatMonth(SURVEY_INFLUENCED_DOCUMENTS.since)}. Il n'est pas calculé à
          partir de la base de données.
        </p>
      </Accordion>
      <Accordion label="Départements où la DDT est engagée">
        <p className="fr-mb-0">
          Départements d'au moins un EPCI figurant dans une simulation non supprimée créée par un agent de DDT. Une DDT inscrite sans avoir
          lancé de simulation n'est pas comptée. Le total correspond aux départements du référentiel des EPCI.
        </p>
      </Accordion>
      <Accordion label="Évolution mensuelle">
        <p className="fr-mb-0">
          Pour chacun des 24 derniers mois : simulations créées et non supprimées, demandes d'export PowerPoint (un export de plusieurs
          scénarios en une fois compte pour une demande), et EPCI distincts concernés par les simulations créées dans le mois.
        </p>
      </Accordion>
      <Accordion label="Objectifs hors construction neuve">
        <p className="fr-mb-0">
          Pour chaque scénario exporté, écart entre le taux visé et le taux observé (vacance longue durée, résidences secondaires,
          restructuration, disparition), en pourcentage du taux observé, moyenné sur les EPCI du scénario. La page affiche la médiane de ces
          écarts ; seuls les scénarios dont le taux observé n'est pas nul sont pris en compte.
        </p>
      </Accordion>
    </div>
  )
}
