'use client'

import Button from '@codegouvfr/react-dsfr/Button'
import { useRouter } from 'next/navigation'
import { FC } from 'react'
import { Dropdown } from '~/components/common/dropdown'
import ProfileInitials from '~/components/common/profile-image'
import { ReportIssueButton } from '~/components/report-issue-button'
import { signOut, useSession } from '~/lib/auth/client'

export const QuickAccessItems: FC = () => {
  const { data: session } = useSession()
  const router = useRouter()

  if (session) {
    const user = session.user
    return [
      <ReportIssueButton key="report-issue" />,
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
        <Dropdown id="user-menu" alignRight control={`${user.firstname} ${user.lastname}`} dropdownControlClassName="fr-mb-0">
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
              <Button
                key="logout"
                iconId="fr-icon-logout-box-r-line"
                priority="tertiary no outline"
                onClick={() =>
                  signOut({
                    fetchOptions: {
                      onSuccess: () => {
                        router.push('/accueil')
                        router.refresh()
                      },
                    },
                  })
                }
              >
                Se déconnecter
              </Button>
            </li>
          </ul>
        </Dropdown>
      </div>,
    ]
  }

  return [
    <ReportIssueButton key="report-issue" />,
    <Button iconId="fr-icon-account-fill" linkProps={{ href: '/connexion' }} key="sign-in-button">
      S&apos;inscrire ou se connecter
    </Button>,
  ]
}
