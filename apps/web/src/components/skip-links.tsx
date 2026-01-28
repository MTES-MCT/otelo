import { fr } from '@codegouvfr/react-dsfr'
import { FC } from 'react'

export const SkipLinks: FC = () => {
  return (
    <div className={fr.cx('fr-skiplinks')}>
      <nav role="navigation" aria-label="Accès rapide" className={fr.cx('fr-container')}>
        <ul className={fr.cx('fr-skiplinks__list')}>
          <li>
            <a className={fr.cx('fr-link')} href="#content">
              Contenu
            </a>
          </li>
          <li>
            <a className={fr.cx('fr-link')} href="#header-navigation">
              Menu
            </a>
          </li>
          <li>
            <a className={fr.cx('fr-link')} href="#footer">
              Pied de page
            </a>
          </li>
        </ul>
      </nav>
    </div>
  )
}
