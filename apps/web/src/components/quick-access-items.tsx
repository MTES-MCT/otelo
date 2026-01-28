'use client'

import Button from '@codegouvfr/react-dsfr/Button'
import { useSession } from 'next-auth/react'
import { FC, useEffect } from 'react'
import { handleSignOut } from '~/app/(authenticated)/signout'
import { Dropdown } from '~/components/common/dropdown'
import ProfileInitials from '~/components/common/profile-image'
import { CustomUser } from '~/lib/auth/auth.config'

export const QuickAccessItems: FC = () => {
  const { data: session } = useSession()

  useEffect(() => {
    if (session?.error) {
      handleSignOut()
    }
  }, [session])

  const getUserDisplayName = (user: CustomUser) => {
    return `${user.firstname} ${user.lastname}`
  }

  if (session) {
    const user = session.user as CustomUser
    return [
      <Button
        iconId="fr-icon-arrow-right-line"
        className="fr-mb-0"
        linkProps={{ href: '/simulation/choix-du-territoire' }}
        key="access-app"
      >
        Élaborer un scénario
      </Button>,
      <div className="fr-border-right fr-height-full" key="border" />,
      <div key="dropdown" className="fr-position-relative">
        <Dropdown id="user-menu" alignRight control={getUserDisplayName(user)} dropdownControlClassName="fr-mb-0">
          <ul>
            <div className="fr-flex fr-align-items-center fr-p-2w fr-text--start">
              <ProfileInitials firstName={user.firstname} lastName={user.lastname} size={24} className="fr-mr-3v" />
              <div className="fr-flex fr-direction-column">
                <li className="fr-text--bold">
                  {user.firstname} {user.lastname}
                </li>
                <li className="fr-text--sm fr-text-mention--grey fr-mb-0">{user.email}</li>
              </div>
            </div>
            <li className="fr-border-top">
              <Button key="logout" iconId="fr-icon-logout-box-r-line" priority="tertiary no outline" onClick={handleSignOut}>
                Se déconnecter
              </Button>
            </li>
          </ul>
        </Dropdown>
      </div>,
    ]
  }

  return [
    <Button iconId="fr-icon-account-fill" linkProps={{ href: '/connexion' }} key="sign-in-button">
      S&apos;inscrire ou se connecter
    </Button>,
  ]
}
