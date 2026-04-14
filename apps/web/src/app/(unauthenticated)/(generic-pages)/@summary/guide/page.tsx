import { Summary } from '../summary'

export default function SummarySlot() {
  return (
    <Summary
      items={[
        {
          linkProps: {
            href: '#quest-ce-qu-otelo',
          },
          text: "Qu'est-ce qu'Otelo ?",
          items: [
            {
              linkProps: {
                href: '#les-echelles-geographiques',
              },
              text: 'Les échelles géographiques',
              items: [
                {
                  linkProps: {
                    href: '#epci',
                  },
                  text: "🏛️ L'EPCI",
                },
                {
                  linkProps: {
                    href: '#bassins-habitat',
                  },
                  text: "🏘️ Les bassins d'habitat",
                },
              ],
            },
            {
              linkProps: {
                href: '#elements-cadrage',
              },
              text: 'Les éléments de cadrage',
            },
            {
              linkProps: {
                href: '#donnees-demarrer',
              },
              text: 'Les données pour démarrer',
            },
            {
              linkProps: {
                href: '#hypotheses-utilisateur',
              },
              text: "Hypothèses de l'utilisateur",
            },
            {
              linkProps: {
                href: '#fonctionnement-methode',
              },
              text: 'Le fonctionnement de la méthode de calcul',
              items: [
                {
                  linkProps: {
                    href: '#utilisateur-choisi',
                  },
                  text: "Ce que l'utilisateur choisi",
                },
                {
                  linkProps: {
                    href: '#otelo-fait',
                  },
                  text: 'Ce que fait Otelo',
                },
              ],
            },
            {
              linkProps: {
                href: '#resultats-otelo',
              },
              text: 'Les résultats fournis par Otelo',
            },
          ],
        },
        {
          linkProps: {
            href: '#briques-besoin-logements',
          },
          text: 'Les briques du besoin en logements',
          expandedByDefault: true,
          items: [
            {
              linkProps: {
                href: '#projections-demographiques',
              },
              text: '📊 Projections démographiques',
              items: [
                {
                  linkProps: {
                    href: '#elaboration-projections',
                  },
                  text: '🧠 Comprendre comment sont élaborées les projections démographiques',
                },
                {
                  linkProps: {
                    href: '#projections-population',
                  },
                  text: '📊 Les projections de population dans Otelo',
                },
                {
                  linkProps: {
                    href: '#projections-menages',
                  },
                  text: '🧮 Les projections de ménages : les scénarios de décohabitation',
                },
                {
                  linkProps: {
                    href: '#ventilation-projections',
                  },
                  text: '🔍 Ventilation des projections : une méthode reflétant les dynamiques locales',
                },
              ],
            },
            {
              linkProps: {
                href: '#donnees-parc-logement',
              },
              text: '📊 Les données sur le parc de logements',
            },
            {
              linkProps: {
                href: '#situations-mal-logement',
              },
              text: '🎯 Les situations de mal-logement et de hors-logement',
              items: [
                {
                  linkProps: {
                    href: '#horizon-resorption',
                  },
                  text: 'Horizon de résorption',
                },
                {
                  linkProps: {
                    href: '#hors-logement',
                  },
                  text: 'Hors-logement',
                  items: [
                    {
                      linkProps: {
                        href: '#sans-abris-habitations-fortune',
                      },
                      text: "Sans-abris, habitations de fortune et logés à l'hôtel",
                    },
                    {
                      linkProps: {
                        href: '#hebergement-social',
                      },
                      text: 'Hébergement social',
                    },
                  ],
                },
                {
                  linkProps: {
                    href: '#heberges',
                  },
                  text: 'Hébergés',
                  items: [
                    {
                      linkProps: {
                        href: '#cohabitation-intergenerationnelle',
                      },
                      text: 'Cohabitation intergénérationnelle présumée subie',
                    },
                    {
                      linkProps: {
                        href: '#heberges-chez-tiers',
                      },
                      text: 'Hébergés chez un tiers',
                    },
                  ],
                },
                {
                  linkProps: {
                    href: '#mal-logement',
                  },
                  text: 'Mal-logement',
                  items: [
                    {
                      linkProps: {
                        href: '#depense-excessive-logement',
                      },
                      text: 'Dépense excessive en logement',
                    },
                    {
                      linkProps: {
                        href: '#menages-logement-degrade',
                      },
                      text: 'Ménages habitant un logement dégradé',
                    },
                    {
                      linkProps: {
                        href: '#sur-occupation',
                      },
                      text: 'Sur-occupation',
                    },
                  ],
                },
                {
                  linkProps: {
                    href: '#doublons',
                  },
                  text: 'Prise en compte de doublons éventuels',
                },
              ],
            },
          ],
        },
        {
          linkProps: {
            href: '#elaborer-scenario',
          },
          text: '🎯 Élaborer un scénario',
          items: [
            {
              linkProps: {
                href: '#etapes-recommandees',
              },
              text: 'Étapes recommandées',
              items: [
                {
                  linkProps: {
                    href: '#diagnostic-situation',
                  },
                  text: '📋 Diagnostic de situation',
                },
                {
                  linkProps: {
                    href: '#definition-parametres',
                  },
                  text: '🎛️ Définition des paramètres',
                },
                {
                  linkProps: {
                    href: '#simulation-analyse',
                  },
                  text: '📈 Simulation et analyse',
                },
                {
                  linkProps: {
                    href: '#validation-ajustements',
                  },
                  text: '✅ Validation et ajustements',
                },
              ],
            },
          ],
        },
        {
          linkProps: {
            href: '#comment-utiliser-otelo',
          },
          text: '🛠️ Comment bien utiliser Otelo',
          items: [
            {
              linkProps: {
                href: '#conseils-pratiques',
              },
              text: 'Conseils pratiques',
              items: [
                {
                  linkProps: {
                    href: '#bonnes-pratiques',
                  },
                  text: '✅ Bonnes pratiques',
                },
                {
                  linkProps: {
                    href: '#points-attention',
                  },
                  text: "⚠️ Points d'attention",
                },
              ],
            },
            {
              linkProps: {
                href: '#support-assistance',
              },
              text: 'Support et assistance',
            },
          ],
        },
      ]}
    />
  )
}
