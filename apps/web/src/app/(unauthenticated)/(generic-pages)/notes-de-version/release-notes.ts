export type ReleaseNotesByMonth = Record<string, string[]>
export type ReleaseNotes = Record<number, ReleaseNotesByMonth>

export const RELEASE_NOTES: ReleaseNotes = {
  2026: {
    mars: [
      'Correction du calcul de certaines situations de mal-logement pour améliorer la fiabilité des résultats.',
      "Amélioration de la prise de contact depuis la page dédiée, pour limiter les erreurs lors de l'envoi.",
    ],
    fevrier: [
      "Ajout d'une page de retours utilisateurs pour partager les expériences terrain.",
      "Refonte de la gestion des utilisateurs pour simplifier l'administration des accès.",
      "Ajout d\'un bandeau de feedback pour recueillir plus facilement les retours dans l'outil.",
      "Ajout de l'historique des résultats de simulation pour comparer les évolutions dans le temps.",
      "Ajout d'un bouton d'export des résultats pour faciliter le partage et l'analyse hors de l'application.",
      "Ajout de l'export Excel des statistiques des simulations.",
      'Ajout de la page "Sources de données" pour mieux comprendre les données utilisées.',
      'Amélioration de la fonctionnalité territoires voisins pour faciliter la lecture des dynamiques avec les EPCI limitrophes.',
      "Amélioration de l'affichage des graphiques de synthèse et des indicateurs associés.",
      "Prise en compte des groupes d'EPCI avec possibilité de suppression d'un groupe.",
      'Amélioration de la lisibilité des exports et visuels (arrondis, libellés, présentation).',
      'Mise en place du versioning des jeux de données pour mieux suivre les millésimes utilisés.',
    ],
    janvier: [
      'Mise en ligne de la nouvelle base applicative (refonte globale).',
      "Ajout d'un mode de comparaison avec les territoires voisins (première version - accessible en bêta test).",
      'Mise à jour du parcours de connexion pour une authentification plus robuste.',
      "Ajout d'une page 404 lorsque une page est inexistante et amélioration de la déconnexion utilisateur.",
    ],
  },
  2025: {
    decembre: [
      "Refonte de l'interface pour rendre les parcours plus lisibles et plus fluides.",
      "Ajout du mode d'usurpation pour permettre aux équipes d'appui de diagnostiquer plus facilement les situations remontées.",
      "Ajout de l'export des statistiques d'usage dans l'espace d'administration.",
      'Ajout de graphiques de comparaison du parc pour mieux visualiser les effets des réglages.',
    ],
    novembre: [
      "Ajout du parcours de mot de passe oublié pour faciliter la récupération d'accès.",
      "Généralisation de l'export PowerPoint pour partager plus facilement les résultats de simulation.",
      "Ajout d'indicateurs complémentaires dans les infographies (taille des ménages, Sitadel...).",
      "Amélioration de la robustesse des calculs autour de l'année de pic pour des résultats plus cohérents.",
    ],
    octobre: [
      'Ajout de la prise en compte des résidences secondaires dans la lecture des résultats.',
      "Ajout du téléchargement d'un export de résultat de simulation pour faciliter le partage.",
      'Ajout de mesures de suivi sur les exports afin de mieux piloter les usages.',
      'Mise à jour du guide utilisateur pour mieux accompagner la prise en main.',
    ],
    septembre: [
      "Ajout de la vérification d'email pour sécuriser la création de compte.",
      "Ajout de la possibilité d'identifier un scénario de référence (scénario privilégié).",
      "Amélioration de l'export Excel avec davantage de détails utiles à l'analyse.",
      "Ajout d'un tableau de détail par EPCI pour affiner la lecture des résultats territoriaux.",
      'Amélioration du parcours de paramétrage du mal-logement avec plus de guidance étape par étape.',
    ],
    aout: [
      "Améliorations d'accessibilité sur les pages connectées (navigation et lisibilité).",
      'Mise en place du suivi statistique des simulations et des exports.',
      "Ajout d'un contrôle d'accès à l'inscription pour mieux maîtriser l'ouverture de l'outil.",
      'Amélioration du parcours de connexion avec une meilleure gestion des erreurs.',
    ],
    juillet: [
      "Mise à jour du moteur de calcul pour fiabiliser l'estimation des besoins.",
      "Ajout de la sélection par bassin d'habitat dans le choix du territoire.",
      "Ajout de l'import de projections démographiques personnalisées (fichier CSV).",
      "Ajout de la page de contact pour faciliter les échanges avec l'équipe Otelo.",
      'Ajout de nouveaux indicateurs liés au renouvellement urbain et à son impact sur les besoins.',
    ],
    juin: [
      'Mise en place du tableau de bord pour retrouver et piloter ses simulations plus facilement.',
      'Ajout des actions de suppression et de duplication de simulation depuis le tableau de bord.',
      "Ajout de la sélection d'EPCI contigus pour construire des périmètres de travail plus cohérents.",
      "Ajout de l'envoi de demande d'export PowerPoint depuis le tableau de bord (première version).",
      "Amélioration de la gestion des accès avec redirection explicite en cas d'autorisation insuffisante.",
    ],
  },
}

const MONTH_LABELS: Record<string, string> = {
  janvier: 'Janvier',
  fevrier: 'Février',
  mars: 'Mars',
  avril: 'Avril',
  mai: 'Mai',
  juin: 'Juin',
  juillet: 'Juillet',
  aout: 'Août',
  septembre: 'Septembre',
  octobre: 'Octobre',
  novembre: 'Novembre',
  decembre: 'Décembre',
}

const MONTH_ORDER = [
  'janvier',
  'fevrier',
  'mars',
  'avril',
  'mai',
  'juin',
  'juillet',
  'aout',
  'septembre',
  'octobre',
  'novembre',
  'decembre',
]

type Section = {
  id: string
  label: string
  items: string[]
}

export function getReleaseNotesSections(): Section[] {
  const sections: Section[] = []

  const years = Object.keys(RELEASE_NOTES)
    .map(Number)
    .sort((a, b) => b - a)

  for (const year of years) {
    const months = RELEASE_NOTES[year]

    for (const month of [...MONTH_ORDER].reverse()) {
      if (!(month in months)) {
        continue
      }

      sections.push({
        id: `${year}-${month}`,
        items: months[month],
        label: `${MONTH_LABELS[month]} ${year}`,
      })
    }
  }

  return sections
}
