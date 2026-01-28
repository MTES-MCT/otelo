import { fr } from '@codegouvfr/react-dsfr'
import Accordion from '@codegouvfr/react-dsfr/Accordion'
import CallOut from '@codegouvfr/react-dsfr/CallOut'
import classNames from 'classnames'
import type { Metadata } from 'next'
import { CONTACT_EMAIL } from '~/utils/resources'
import styles from './faq.module.css'

export const metadata: Metadata = {
  title: 'FAQ (Foire Aux Questions) Otelo',
}

export default function FaqPage() {
  return (
    <section className={fr.cx('fr-container')}>
      <h1 className={fr.cx('fr-mb-16v')}>Foire aux question</h1>
      <div className={fr.cx('fr-grid-row')}>
        <div className={classNames(fr.cx('fr-col-12', 'fr-col-md-8'), styles.aideContainer)}>
          <div className={fr.cx('fr-accordions-group', 'fr-mb-12v')}>
            <h5>🏠 Présentation générale d'Otelo</h5>
            <Accordion label="Qu'est-ce qu'Otelo ?">
              <p>
                <strong>Otelo</strong> est un outil numérique développé par la <strong>DGALN</strong>
                (Direction Générale de l'Aménagement, du Logement et de la Nature) et le <strong>Cerema</strong> (Centre d'études et
                d'expertise sur les risques, l'environnement, la mobilité et l'aménagement).
              </p>

              <p>
                <strong>Son objectif :</strong> Aider les collectivités à estimer précisément leurs besoins en logement en analysant :
              </p>

              <ul>
                <li>
                  📈 <strong>Les besoins futurs</strong> : logements nécessaires pour les nouveaux habitants
                </li>
                <li>
                  🏚️ <strong>Les besoins actuels</strong> : logements pour résoudre le mal-logement existant
                </li>
              </ul>

              <p>
                <strong>Depuis mai 2023</strong>, Otelo bénéficie de l'accompagnement de <strong>beta.gouv</strong> et de la{' '}
                <strong>Fabrique Numérique</strong>, l'incubateur d'innovation du Ministère de la Transition Écologique.
              </p>
            </Accordion>
            <Accordion label="Pourquoi utiliser Otelo ?">
              <p>
                <strong>Les avantages :</strong>
              </p>

              <ul>
                <li>
                  ✅ <strong>Harmonise les méthodes</strong> d'estimation des besoins en logement
                </li>
                <li>
                  📊 <strong>Structure vos projections</strong> démographiques et d'habitat
                </li>
                <li>
                  🔄 <strong>Compare différents scénarios</strong> pour optimiser vos choix
                </li>
                <li>
                  📋 <strong>Facilite l'élaboration</strong> des documents d'urbanisme (PLH, SCoT, PLUi)
                </li>
              </ul>

              <p>
                <strong>Traduction des acronymes :</strong>
              </p>

              <ul>
                <li>
                  <strong>PLH</strong> : Programme Local de l'Habitat
                </li>
                <li>
                  <strong>SCoT</strong> : Schéma de Cohérence Territoriale
                </li>
                <li>
                  <strong>PLUi</strong> : Plan Local d'Urbanisme intercommunal
                </li>
              </ul>
            </Accordion>
          </div>

          <div className={fr.cx('fr-accordions-group', 'fr-mb-12v')}>
            <h5>👥 Accès et utilisation</h5>
            <Accordion label="Qui peut utiliser Otelo ?">
              <p>
                <strong>Utilisateurs autorisés :</strong>
              </p>

              <ul>
                <li>
                  🏛️ <strong>Collectivités territoriales</strong> (communes, intercommunalités, départements, régions)
                </li>
                <li>
                  🏢 <strong>Services de l'État</strong> (DDT, DREAL, etc.)
                </li>
                <li>
                  🏗️ <strong>Organismes publics et parapublics</strong> :
                  <ul>
                    <li>Agences d'urbanisme</li>
                    <li>EPF (Établissements Publics Fonciers)</li>
                    <li>Bailleurs sociaux</li>
                  </ul>
                </li>
                <li>
                  📝 <strong>Bureaux d'études</strong> mandatés par une collectivité
                </li>
              </ul>
            </Accordion>
            <Accordion label="Comment obtenir un accès à Otelo ?">
              <p>
                <strong>Pour un premier accès :</strong> Déposez votre demande sur <strong>Démarches Simplifiées</strong> (lien fourni lors
                de l'inscription)
              </p>

              <p>
                <strong>Pour ajouter des utilisateurs à un accès existant :</strong> Même procédure via Démarches Simplifiées
              </p>
            </Accordion>
            <Accordion label="Existe-t-il une formation pour utiliser Otelo ?">
              <p>
                <strong>Oui, plusieurs options de formation :</strong>
              </p>

              <ul>
                <li>
                  🎥 <strong>Webinaires gratuits</strong> : inscriptions sur le site officiel
                </li>
                <li>
                  📚 <strong>Guides méthodologiques</strong> et tutoriels en ligne
                </li>
                <li>
                  💼 <strong>Études de cas pratiques</strong> pour apprendre par l'exemple
                </li>
                <li>
                  💬 <strong>Permanences d'accompagnement</strong> pour vos questions spécifiques
                </li>
              </ul>
            </Accordion>
          </div>

          <div className={fr.cx('fr-accordions-group', 'fr-mb-12v')}>
            <h5>📊 Données et sources</h5>
            <Accordion label="Quelles données utilise Otelo ?">
              <p>
                <strong>Sources de données intégrées :</strong>
              </p>

              <p>
                <strong>🏛️ INSEE (Institut National de la Statistique)</strong>
              </p>

              <ul>
                <li>Recensement de la population</li>
                <li>Projections démographiques (modèle Omphale)</li>
              </ul>

              <p>
                <strong>💰 Sources fiscales</strong>
              </p>

              <ul>
                <li>Fichiers LOVAC (Logements Vacants)</li>
                <li>Fichiers Fonciers</li>
              </ul>

              <p>
                <strong>🏥 Bases nationales spécialisées</strong>
              </p>

              <ul>
                <li>FINESS : établissements de santé</li>
                <li>SNE : hébergement touristique</li>
                <li>CNAF : allocations familiales</li>
              </ul>
            </Accordion>
            <Accordion label="À quelle fréquence les données sont-elles mises à jour ?">
              <p>
                <strong>Calendrier variable selon les sources :</strong>
              </p>

              <ul>
                <li>
                  📅 <strong>Tous les 4 ans</strong> : Projections de ménages INSEE
                </li>
                <li>
                  📅 <strong>Chaque année</strong> : Données de recensement, fichiers fiscaux et sociaux
                </li>
              </ul>

              <p>
                <strong>⚠️ Important :</strong> Les mises à jour dans Otelo peuvent avoir un délai selon la transmission par les organismes
                producteurs.
              </p>
            </Accordion>
          </div>

          <div className={fr.cx('fr-accordions-group', 'fr-mb-12v')}>
            <h5>🎯 Méthodologie et projections</h5>
            <Accordion label="Sur quelle période Otelo projette-t-il les besoins ?">
              <p>
                <strong>Horizon de projection :</strong> Jusqu'en <strong>2050</strong>
              </p>

              <p>
                <strong>Flexibilité :</strong> Scénarios entièrement paramétrables selon vos spécificités locales
              </p>
            </Accordion>
            <Accordion label="Quels indicateurs peut-on paramétrer dans Otelo ?">
              <p>
                <strong>Paramètres ajustables :</strong>
              </p>

              <ul>
                <li>
                  👥 <strong>Évolution de la population</strong>
                </li>
                <li>
                  🏠 <strong>Évolution du nombre de ménages</strong>
                </li>
                <li>
                  🏚️ <strong>Part des logements vacants de longue durée</strong>
                </li>
                <li>
                  🏖️ <strong>Part des résidences secondaires</strong>
                </li>
                <li>
                  ⚠️ <strong>Nombre de logements indignes à reconstruire</strong>
                </li>
                <li>Et bien d'autres selon vos besoins...</li>
              </ul>
            </Accordion>
            <Accordion label="Comment choisir mon scénario démographique ?">
              <p>
                <strong>Les scénarios INSEE expliqués :</strong>
              </p>

              <p>
                <strong>📈 Scénario "Population Haute"</strong>
              </p>

              <ul>
                <li>Hypothèses optimistes (forte natalité, faible mortalité)</li>
                <li>Évolution démographique importante</li>
              </ul>

              <p>
                <strong>📊 Scénario "Population Centrale"</strong>
              </p>

              <ul>
                <li>Hypothèses moyennes</li>
                <li>Évolution basée sur les tendances actuelles</li>
              </ul>

              <p>
                <strong>📉 Scénario "Population Basse"</strong>
              </p>

              <ul>
                <li>Hypothèses pessimistes (faible natalité, forte mortalité)</li>
                <li>Croissance plus faible, voire décroissance</li>
              </ul>

              <p>
                <strong>⚠️ Attention :</strong> "Population Basse" ne signifie pas forcément perte d'habitants, mais évolution plus faible
                que dans les autres scénarios.
              </p>
            </Accordion>
            <Accordion label="Comment Otelo gère-t-il le pic de ménages ?">
              <p>
                <strong>Principe :</strong> Quand le nombre de ménages diminue sur un territoire, les besoins en nouveaux logements
                deviennent nuls.
              </p>

              <p>
                <strong>Dans Otelo :</strong> L'outil détecte automatiquement cette situation et ajuste les calculs en conséquence.
                L'horizon de projection est automatiquement ramené à l'année à laquelle le territoire atteint son pic.
              </p>
            </Accordion>
          </div>

          <div className={fr.cx('fr-accordions-group', 'fr-mb-12v')}>
            <h5>🏚️ Mal-logement et situations spécifiques</h5>
            <Accordion label="Que considère Otelo comme du mal-logement ?">
              <p>
                <strong>Situations incluses :</strong>
              </p>

              <ul>
                <li>
                  🛏️ <strong>Personnes hébergées</strong> cherchant un logement autonome
                </li>
                <li>
                  🏕️ <strong>Personnes vivant hors logement</strong> (sans-abri, abri de fortune)
                </li>
                <li>
                  💸 <strong>Logement trop cher</strong> par rapport aux revenus
                </li>
                <li>
                  🚿 <strong>Logement de mauvaise qualité</strong> (ex : sans sanitaires, sans salle de bain)
                </li>
                <li>
                  👥 <strong>Surpopulation</strong> dans le logement actuel
                </li>
              </ul>
            </Accordion>
            <Accordion label="Les résidences secondaires sont-elles considérées comme des logements vacants ?">
              <p>
                <strong>Non, distinction claire dans Otelo :</strong>
              </p>

              <ul>
                <li>
                  🏖️ <strong>Résidences secondaires</strong> : occupées de façon intermittente, non disponibles pour le marché permanent
                </li>
                <li>
                  🏚️ <strong>Logements vacants</strong> : inoccupés et potentiellement disponibles
                </li>
              </ul>

              <p>
                <strong>Paramétrage :</strong> Vous pouvez ajuster la part des résidences secondaires dans le parc total selon votre
                territoire.
              </p>
            </Accordion>
          </div>

          <div className={fr.cx('fr-accordions-group', 'fr-mb-12v')}>
            <h5>📈 Comprendre les résultats</h5>
            <Accordion label="Comment lire la page de résultats d'Otelo ?">
              <p>
                <strong>Quatre types de besoins calculés :</strong>
              </p>

              <p>
                <strong>🏗️ Besoin en constructions neuves</strong>
              </p>

              <ul>
                <li>
                  <strong>Définition :</strong> Nombre total de logements <strong>à construire</strong>
                </li>
                <li>
                  <strong>Calcul :</strong> Logements futurs + Logements pour le mal-logement actuel
                </li>
              </ul>

              <p>
                <strong>📈 Logements à construire pour répondre aux besoins futurs</strong>
              </p>

              <ul>
                <li>
                  <strong>Définition :</strong> Logements pour les nouveaux habitants et ménages
                </li>
                <li>
                  <strong>Utilité :</strong> Répondre à la croissance démographique
                </li>
              </ul>

              <p>
                <strong>🏚️ Logements à construire pour lutter contre le mal-logement</strong>
              </p>

              <ul>
                <li>
                  <strong>Définition :</strong> Logements pour résoudre les situations difficiles actuelles
                </li>
                <li>
                  <strong>Utilité :</strong> Améliorer les conditions de vie existantes
                </li>
              </ul>

              <p>
                <strong>🏚️ Logements à remobiliser issus des logements structurellement vacants</strong>
              </p>
            </Accordion>
            <Accordion label="Otelo précise-t-il la typologie des logements à construire ?">
              <p>
                <strong>Non, Otelo calcule uniquement :</strong>
              </p>

              <ul>
                <li>Le nombre global de logements nécessaires</li>
                <li>Pas la répartition par taille (T1, T2, T3, etc.)</li>
                <li>Pas la typologie (collectif, individuel, etc.)</li>
              </ul>

              <p>
                <strong>Pourquoi :</strong> L'outil se concentre sur l'estimation quantitative, les choix qualitatifs restent du ressort des
                décideurs locaux.
              </p>
            </Accordion>
            <Accordion label="Comment utiliser les résultats dans les documents d'urbanisme ?">
              <p>
                <strong>Applications pratiques :</strong>
              </p>

              <ul>
                <li>
                  📋 <strong>Justifier les objectifs</strong> de construction dans vos PLH, PLUi, SCoT
                </li>
                <li>
                  🎯 <strong>Orienter les politiques locales</strong> de l'habitat
                </li>
                <li>
                  💰 <strong>Dimensionner les budgets</strong> et programmes d'investissement
                </li>
                <li>
                  🗺️ <strong>Localiser les futurs projets</strong> de logement
                </li>
              </ul>
            </Accordion>
          </div>

          <div className={fr.cx('fr-accordions-group', 'fr-mb-12v')}>
            <h5>📚 Glossaire des termes Otelo</h5>
            <Accordion label="Définitions des termes clés">
              <p>
                <strong>Logements futurs :</strong> Logements à construire pour accueillir les nouveaux ménages liés à la croissance
                démographique future.
              </p>

              <p>
                <strong>Logements pour le mal-logement :</strong> Logements à créer ou réhabiliter pour résoudre les situations actuelles de
                mal-logement.
              </p>

              <p>
                <strong>Décohabitation :</strong> Phénomène par lequel des personnes quittent un logement partagé pour créer des ménages
                indépendants (jeunes adultes, séparations, etc.).
              </p>

              <p>
                <strong>Vacance structurelle :</strong> Logements durablement inoccupés, même en période de forte demande. C'est cette
                vacance "structurelle" que paramètre Otelo.
              </p>

              <p>
                <strong>Vacance frictionnelle :</strong> Logements temporairement vides pour des raisons normales (changement de locataire,
                travaux, mise en vente). Généralement faible et non problématique.
              </p>
            </Accordion>
          </div>

          <div className={fr.cx('fr-accordions-group', 'fr-mb-12v')}>
            <h5>📞 Support et assistance</h5>
            <Accordion label="Comment obtenir de l'aide ?">
              <p>
                <strong>En cas de question :</strong>
              </p>

              <ul>
                <li>🌐 Consultez la documentation en ligne</li>
                <li>👥 Rejoignez les webinaires et formations collectives</li>
                <li>📧 Participez aux permanences d'accompagnement</li>
                <li>
                  📞 Contactez l'équipe support : <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
                </li>
              </ul>

              <p>
                <strong>Conseil :</strong> N'hésitez pas à utiliser les services d'accompagnement, ils sont là pour vous aider à tirer le
                meilleur parti d'Otelo !
              </p>
            </Accordion>
          </div>

          <CallOut className={fr.cx('fr-mb-12v')} title="Nous n'avons pas répondu à votre question ?">
            Contactez l'équipe Otelo à l'adresse : <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
          </CallOut>
        </div>
      </div>
    </section>
  )
}
