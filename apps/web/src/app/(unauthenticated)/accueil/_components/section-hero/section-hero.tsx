import logoCerema from '@assets/img/logo-cerema.svg'
import logoMinistere from '@assets/img/logo-ministere.svg'
import { fr } from '@codegouvfr/react-dsfr'
import { Button } from '@codegouvfr/react-dsfr/Button'
import classNames from 'classnames'
import Image from 'next/image'
import { getServerSession } from 'next-auth'
import { authOptions } from '~/lib/auth/auth.config'
import styles from './section-hero.module.css'

export const SectionHero = async () => {
  const session = await getServerSession(authOptions)

  const ctaComponent = session ? (
    <Button
      linkProps={{
        href: '/simulation/choix-du-territoire',
      }}
    >
      Élaborer un scénario
    </Button>
  ) : (
    <Button iconId="fr-icon-account-fill" linkProps={{ href: '/connexion' }}>
      S&apos;inscrire ou se connecter
    </Button>
  )

  return (
    <section className={classNames(fr.cx('fr-container', 'fr-py-20v'), styles.heroSection)}>
      <div className={fr.cx('fr-grid-row', 'fr-grid-row-xl--gutters')}>
        <div className={classNames(fr.cx('fr-col-12', 'fr-col-lg-8'), styles.heroContent)}>
          <h1 className={styles.title}>Otelo, estimez finement les besoins en logement de votre territoire</h1>
          <p className={styles.description}>
            Construisez les <strong>scénarios de besoins en logements adaptés à vos documents d'urbanisme</strong> grâce à notre
            méthodologie de référence, aux millions de données territoriales analysées automatiquement, à nos guides sur les enjeux de mal
            logement, sobriété foncière et vacance immobilière.
          </p>
          <div className={fr.spacing('10w')}>{ctaComponent}</div>
          <p className={fr.cx('fr-info-text', 'fr-py-4v')}>
            Connexion requise uniquement pour estimer les besoins en logement d'un territoire — Accès libre à toutes les autres
            fonctionnalités.
          </p>
        </div>
        <div className={classNames(fr.cx('fr-col-12', 'fr-col-lg-4', 'fr-text--bold'), styles.heroSide)}>
          <p>
            Une petite révolution <br />
            créée par :
          </p>
          <div className={styles.heroSideImgs}>
            <Image src={logoMinistere} className={styles.logo} alt="Ministère de la Transition Écologique" />
            <Image src={logoCerema} className={styles.logo} alt="Cerema" />
          </div>
        </div>
      </div>
    </section>
  )
}
