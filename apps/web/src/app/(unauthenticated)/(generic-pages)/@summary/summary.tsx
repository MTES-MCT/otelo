import { SideMenu, SideMenuProps } from '@codegouvfr/react-dsfr/SideMenu'
import styles from './summary.module.css'

type SummaryProps = {
  items: SideMenuProps['items']
}

export function Summary({ items }: SummaryProps) {
  return (
    <div className={styles.stickyContainer}>
      <SideMenu align="left" burgerMenuButtonText="Sommaire" items={items} title="Sommaire" />
    </div>
  )
}
