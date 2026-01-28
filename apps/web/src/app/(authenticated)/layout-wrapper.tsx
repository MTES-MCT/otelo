'use client'

import classNames from 'classnames'
import { usePathname } from 'next/navigation'
import styles from './layout.module.css'

interface LayoutWrapperProps {
  children: React.ReactNode
}

export default function LayoutWrapper({ children }: LayoutWrapperProps) {
  const pathname = usePathname()
  const isResultsPage = pathname.includes('/resultats')

  return <div className={classNames(isResultsPage ? styles.containerResults : styles.container, 'fr-py-md-5w fr-py-2w')}>{children}</div>
}
