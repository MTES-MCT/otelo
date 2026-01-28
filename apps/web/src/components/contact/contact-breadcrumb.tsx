import Breadcrumb from '@codegouvfr/react-dsfr/Breadcrumb'
import { FC } from 'react'

export const ContactBreadcrumb: FC = () => {
  return (
    <Breadcrumb
      currentPageLabel="Nous contacter"
      homeLinkProps={{
        href: '/accueil',
      }}
      segments={[]}
    />
  )
}
