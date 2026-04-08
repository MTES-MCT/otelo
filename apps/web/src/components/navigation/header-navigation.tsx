'use client'

import { MainNavigation, MainNavigationProps } from '@codegouvfr/react-dsfr/MainNavigation'
import { usePathname } from 'next/navigation'
import { FC } from 'react'
import { useEpciNeighborsAccess } from '~/hooks/use-epci-neighbors-access'
import { useSession } from '~/lib/auth/client'

export const HeaderNavigation: FC = () => {
  const pathname = usePathname()
  const { data: session } = useSession()

  const { hasAccess: hasEpciNeighborsAccess } = useEpciNeighborsAccess()

  const isAdmin = session?.user?.role === 'ADMIN'
  const items = session ? getMenuConnected(pathname, isAdmin, hasEpciNeighborsAccess) : getMenuDisconnected(pathname)

  return <MainNavigation id="header-navigation" items={items} />
}

const getMenuDisconnected = (pathname: string): MainNavigationProps.Item[] => [
  {
    isActive: pathname === '/accueil',
    linkProps: { href: '/accueil', target: '_self' },
    text: 'Accueil',
  },
  {
    isActive: pathname === '/guide',
    linkProps: { href: '/guide', target: '_self' },
    text: 'Découvrir Otelo',
  },
  {
    isActive: pathname === '/ressources',
    linkProps: { href: '/ressources', target: '_self' },
    text: 'Ressources',
  },
  {
    isActive: pathname === '/statistiques',
    linkProps: { href: '/statistiques', target: '_self' },
    text: 'Statistiques',
  },
  {
    isActive: pathname === '/faq',
    linkProps: { href: '/faq', target: '_self' },
    text: 'FAQ',
  },
  {
    isActive: pathname === '/contact',
    linkProps: { href: '/contact', target: '_self' },
    text: 'Nous contacter',
  },
]

const getMenuConnected = (pathname: string, isAdmin = false, hasEpciNeighborsAccess = false): MainNavigationProps.Item[] => [
  {
    isActive: pathname === '/accueil',
    linkProps: { href: '/accueil', target: '_self' },
    text: 'Accueil',
  },
  {
    isActive: /tableaux?-de-bord/.test(pathname),
    linkProps: { href: '/tableaux-de-bord', target: '_self' },
    text: 'Tableau de bord',
  },
  {
    isActive: pathname === '/infographies',
    linkProps: { href: '/infographies', target: '_self' },
    text: 'Infographies',
  },
  ...(hasEpciNeighborsAccess
    ? [
        {
          isActive: pathname === '/territoires-voisins',
          linkProps: { href: '/territoires-voisins', target: '_self' },
          text: 'Territoires voisins',
        },
      ]
    : []),
  {
    isActive: [
      '/guide',
      '/apprendre-a-utiliser-l-outil',
      '/aller-plus-loin-methodologie',
      '/tester-mes-connaissances',
      '/participer-a-une-formation',
      '/ressources',
      '/retours-d-experience',
      '/faq',
      '/sources-de-donnees',
    ].includes(pathname),
    menuLinks: [
      {
        isActive: pathname === '/guide',
        linkProps: {
          href: '/guide',
        },
        text: 'Découvrir Otelo',
      },
      {
        isActive: pathname === '/apprendre-a-utiliser-l-outil',
        linkProps: {
          href: '/apprendre-a-utiliser-l-outil',
        },
        text: "Apprendre à utiliser l'outil pas à pas",
      },
      {
        isActive: pathname === '/aller-plus-loin-methodologie',
        linkProps: {
          href: '/aller-plus-loin-methodologie',
        },
        text: 'Aller plus loin dans la méthodologie',
      },
      {
        isActive: pathname === '/tester-mes-connaissances',
        linkProps: {
          href: '/tester-mes-connaissances',
        },
        text: 'Tester mes connaissances',
      },
      {
        isActive: pathname === '/participer-a-une-formation',
        linkProps: {
          href: '/participer-a-une-formation',
        },
        text: 'Participer à une formation',
      },
      {
        isActive: pathname === '/faq',
        linkProps: { href: '/faq', target: '_self' },
        text: 'Foire aux questions',
      },
      {
        isActive: pathname === '/sources-de-donnees',
        linkProps: {
          href: '/sources-de-donnees',
        },
        text: 'Sources de données',
      },
    ],
    text: "Centre d'aide et ressources",
  },
  {
    isActive: ['/a-propos', '/statistiques', '/pilotage'].includes(pathname),
    menuLinks: [
      {
        isActive: pathname === '/a-propos',
        linkProps: {
          href: '/a-propos',
        },
        text: 'À propos',
      },
      {
        isActive: pathname === '/statistiques',
        linkProps: { href: '/statistiques', target: '_self' },
        text: 'Statistiques',
      },
      {
        isActive: pathname === '/pilotage',
        linkProps: { href: '/pilotage', target: '_self' },
        text: 'Pilotage',
      },
    ],
    text: "À propos d'Otelo",
  },
  ...(isAdmin
    ? [
        {
          isActive: pathname.includes('/admin'),
          menuLinks: [
            {
              isActive: pathname.includes('/admin/gestion-des-utilisateurs'),
              linkProps: {
                href: '/admin/gestion-des-utilisateurs',
                target: '_self',
              },
              text: 'Gestion des utilisateurs',
            },
            {
              isActive: pathname.includes('/admin/statistiques'),
              linkProps: {
                href: '/admin/statistiques',
                target: '_self',
              },
              text: 'Statistiques',
            },
            {
              isActive: pathname.includes('/admin/feedbacks'),
              linkProps: {
                href: '/admin/feedbacks',
                target: '_self',
              },
              text: 'Retours utilisateurs',
            },
            {
              isActive: pathname.includes('/admin/consommateurs'),
              linkProps: {
                href: '/admin/consommateurs',
                target: '_self',
              },
              text: 'Consommateurs API',
            },
          ],
          text: 'Administration',
        },
      ]
    : []),
]
