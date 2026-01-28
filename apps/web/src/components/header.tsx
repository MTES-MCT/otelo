import { fr } from '@codegouvfr/react-dsfr'
import Header from '@codegouvfr/react-dsfr/Header'
import { FC } from 'react'
import { BrandTop } from '~/components/brand-top'
import { HeaderNavigation } from '~/components/navigation/header-navigation'
import { QuickAccessItems } from '~/components/quick-access-items'

export const HeaderComponent: FC = async () => {
  return (
    <Header
      homeLinkProps={{
        href: '/',
        title: 'Accueil - Otelo',
      }}
      quickAccessItems={[<QuickAccessItems key="quick-access-items" />]}
      brandTop={<BrandTop />}
      serviceTagline="Outil gratuit d'aide à l'estimation des besoins en logements sur votre territoire"
      serviceTitle="Otelo"
      navigation={<HeaderNavigation />}
      className={fr.cx('fr-header')}
    />
  )
}
