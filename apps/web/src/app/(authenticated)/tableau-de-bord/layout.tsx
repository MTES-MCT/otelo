import { fr } from '@codegouvfr/react-dsfr'
import { ReactNode } from 'react'

type LayoutProps = {
  children: ReactNode
}

export default function TableauDeBordLayout({ children }: LayoutProps) {
  return <div className={fr.cx('fr-container')}>{children}</div>
}
