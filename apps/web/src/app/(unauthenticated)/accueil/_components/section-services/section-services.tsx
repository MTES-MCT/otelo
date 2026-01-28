import book from '@assets/img/book.svg'
import methodologie from '@assets/img/methodologie.svg'
import { fr } from '@codegouvfr/react-dsfr'
import { Tile } from '@codegouvfr/react-dsfr/Tile'
import classNames from 'classnames'
import styles from './section-services.module.css'

export const SectionServices = () => {
  return (
    <section className={classNames(fr.cx('fr-py-20v'), styles.section)}>
      <div className={classNames(fr.cx('fr-container'), styles.center)}>
        <h2 className={fr.cx('fr-h2', 'fr-mb-3w')}>Les services en libre accès</h2>

        <div className={fr.cx('fr-grid-row', 'fr-grid-row--gutters')}>
          <div className={fr.cx('fr-col-12', 'fr-col-lg-6')}>
            <Tile
              classes={{ img: 'fr-mb-0' }}
              imageUrl={methodologie.src}
              imageAlt="Illustration"
              small
              orientation="vertical"
              title="Guide d'utilisation"
              titleAs="h3"
              desc="Découvrez le détail de la méthodologie Otelo, co-construite par la DGALN du Ministère de la Transition Ecologique, et par le Cerema."
              linkProps={{ href: '/guide' }}
            />
          </div>
          <div className={fr.cx('fr-col-12', 'fr-col-lg-6')}>
            <Tile
              classes={{ img: 'fr-mb-0' }}
              imageUrl={book.src}
              imageAlt="Illustration"
              small
              orientation="vertical"
              title="Ressources"
              titleAs="h3"
              desc="Mettez à jour vos connaissances sur l'urbanisme et l'habitat grâce aux ressources de nos partenaires et aux replays de nos webinaires."
              linkProps={{ href: '/ressources' }}
            />
          </div>
        </div>
      </div>
    </section>
  )
}
