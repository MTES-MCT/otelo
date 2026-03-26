import { Summary } from '../summary'

export default function SummarySlot() {
  return (
    <Summary
      items={[
        {
          linkProps: {
            href: '#comprendre-donnees-projections',
          },
          text: '📚 Comprendre les données et les calculs de projection',
          items: [
            {
              linkProps: {
                href: '#methodologie-donnees',
              },
              text: 'Otelo – Méthodologie et données',
            },
            {
              linkProps: {
                href: '#projections-demographiques',
              },
              text: 'Projections démographiques',
            },
            {
              linkProps: {
                href: '#projections-menages',
              },
              text: 'Projections en ménages',
            },
            // {
            //   linkProps: {
            //     href: '#mal-logement-integration',
            //   },
            //   text: 'Situations de mal-logement',
            // },
          ],
        },
        {
          linkProps: {
            href: '#comprendre-parametres-parc',
          },
          text: '⚙️ Comprendre les paramètres du parc existant',
          items: [
            {
              linkProps: {
                href: '#vacance-longue-duree',
              },
              text: 'La vacance de longue durée',
            },
            {
              linkProps: {
                href: '#residences-secondaires',
              },
              text: 'Les résidences secondaires',
            },
            {
              linkProps: {
                href: '#disparitions-restructurations',
              },
              text: 'Les disparitions et restructurations',
            },
          ],
        },
        {
          linkProps: {
            href: '#utiliser-otelo-politiques',
          },
          text: '🏛️ Utiliser Otelo dans les politiques publiques',
          items: [
            {
              linkProps: {
                href: '#repondre-aux-elus',
              },
              text: 'Que répondre aux élus ?',
            },
            {
              linkProps: {
                href: '#je-suis-ddt',
              },
              text: 'Je suis une DDT',
            },
          ],
        },
      ]}
    />
  )
}
