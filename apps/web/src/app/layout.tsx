import { fr } from '@codegouvfr/react-dsfr'
import { headerFooterDisplayItem } from '@codegouvfr/react-dsfr/Display'
import { Footer } from '@codegouvfr/react-dsfr/Footer'
import { StartDsfrOnHydration } from '@codegouvfr/react-dsfr/next-app-router'
import type { Metadata } from 'next'
import Link from 'next/link'
import { getServerSession } from 'next-auth'
import { NuqsAdapter } from 'nuqs/adapters/next/app'
import { Toaster } from 'sonner'
import { NextAppDirEmotionCacheProvider } from 'tss-react/next/appDir'
import Matomo from '~/app/matomo'
import { BrandTop } from '~/components/brand-top'
import { HeaderComponent } from '~/components/header'
import { SkipLinks } from '~/components/skip-links'
import { DsfrHead, getHtmlAttributes } from '~/dsfr/dsfr-head'
import { DsfrProvider } from '~/dsfr/dsfr-provider'
import { authOptions } from '~/lib/auth/auth.config'
import { NextAuthProvider } from '~/providers/next-auth'
import { TanstackQueryClientProvider } from '~/providers/tanstack-client'
import classes from './layout.module.css'

import '~/global.css'

export const metadata: Metadata = {
  description: "Otelo - votre assistant pour l'estimation des besoins en logements",
  title: {
    default: 'Otelo',
    template: "%s (outil d'urbanisme de l'Etat)",
  },
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const lang = 'fr'
  const session = await getServerSession(authOptions)

  return (
    <html {...getHtmlAttributes({ lang })}>
      <head>
        <DsfrHead preloadFonts={['Marianne-Regular', 'Marianne-Medium', 'Marianne-Bold']} />
        <Matomo />
      </head>
      <body>
        <div className={classes.container}>
          <NextAppDirEmotionCacheProvider options={{ key: 'css' }}>
            <StartDsfrOnHydration />
            <DsfrProvider lang={lang}>
              <TanstackQueryClientProvider>
                <NuqsAdapter>
                  <NextAuthProvider session={session}>
                    <SkipLinks />
                    <HeaderComponent />
                    <main id="content" tabIndex={-1} className={classes.main}>
                      {children}
                    </main>
                    <Footer
                      id="footer"
                      accessibility="non compliant"
                      accessibilityLinkProps={{ href: '/accessibilite', title: 'Accessibilité' }}
                      brandTop={<BrandTop />}
                      homeLinkProps={{
                        href: '/',
                        title: 'Accueil - Otelo',
                      }}
                      termsLinkProps={{ href: '/mentions-legales', title: 'Mentions légales - Otelo' }}
                      bottomItems={[
                        headerFooterDisplayItem,
                        <Link className={fr.cx('fr-footer__bottom-link')} href="/donnees-personnelles">
                          Données personnelles
                        </Link>,
                        <Link className={fr.cx('fr-footer__bottom-link')} href="/cgv">
                          Conditions générales d’utilisation et Gestion des cookies
                        </Link>,
                      ]}
                    />
                    <Toaster
                      toastOptions={{
                        style: {
                          paddingBottom: '1rem',
                        },
                      }}
                    />
                  </NextAuthProvider>
                </NuqsAdapter>
              </TanstackQueryClientProvider>
            </DsfrProvider>
          </NextAppDirEmotionCacheProvider>
        </div>
      </body>
    </html>
  )
}
