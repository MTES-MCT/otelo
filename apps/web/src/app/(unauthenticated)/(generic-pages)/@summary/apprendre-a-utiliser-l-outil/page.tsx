import { Summary } from '../summary'

export default function SummarySlot() {
  return (
    <Summary
      items={[
        {
          linkProps: {
            href: '#debuter-sur-otelo',
          },
          text: '🚀 Débuter sur Otelo',
          items: [
            {
              linkProps: {
                href: '#creer-un-compte',
              },
              text: 'Créer un compte Otelo',
            },
            {
              linkProps: {
                href: '#debuter-elaboration-scenario',
              },
              text: "Débuter l'élaboration d'un scénario",
            },
            {
              linkProps: {
                href: '#elaborer-scenario-a-z',
              },
              text: 'Élaborer un scénario de A à Z',
            },
            {
              linkProps: {
                href: '#creer-territoire-facon',
              },
              text: 'Créer un territoire à façon',
            },
          ],
        },
        {
          linkProps: {
            href: '#parametrer-scenario',
          },
          text: '⚙️ Paramétrer son scénario',
          items: [
            {
              linkProps: {
                href: '#parametrer-projections-demo',
              },
              text: 'Paramétrer les projections démographiques',
            },
            {
              linkProps: {
                href: '#importer-donnees-facon',
              },
              text: 'Importer des données à façon',
            },
            {
              linkProps: {
                href: '#cibler-vacants',
              },
              text: 'Cibler le taux de logements vacants de longue durée',
            },
            {
              linkProps: {
                href: '#cibler-residences-secondaires',
              },
              text: 'Cibler le taux de résidences secondaires',
            },
            {
              linkProps: {
                href: '#parametrer-renouvellement',
              },
              text: 'Paramétrer les dynamiques de renouvellement urbain',
            },
            {
              linkProps: {
                href: '#parametrer-mal-logement',
              },
              text: 'Paramétrer le mal-logement',
            },
          ],
        },
        {
          linkProps: {
            href: '#exploiter-resultats',
          },
          text: '📊 Exploiter les résultats',
          items: [
            // {
            //   linkProps: {
            //     href: '#interpreter-resultats',
            //   },
            //   text: 'Interpréter ses résultats',
            // },
            {
              linkProps: {
                href: '#generer-powerpoint',
              },
              text: 'Générer une présentation PowerPoint éditable',
            },
            // {
            //   linkProps: {
            //     href: '#acces-sources-infographies',
            //   },
            //   text: 'Avoir accès aux sources de données et aux infographies',
            // },
          ],
        },
      ]}
    />
  )
}
