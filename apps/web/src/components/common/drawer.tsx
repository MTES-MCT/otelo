'use client'

import Button from '@codegouvfr/react-dsfr/Button'
import classNames from 'classnames'
import { type ReactNode, useEffect, useId, useRef } from 'react'
import styles from './drawer.module.css'

type DrawerProps = {
  isOpen: boolean
  onClose: () => void
  title: string
  children: ReactNode
}

export const Drawer = ({ isOpen, onClose, title, children }: DrawerProps) => {
  const titleId = useId()
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!isOpen) return

    panelRef.current?.focus()

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKeyDown)

    const { overflow } = document.body.style
    document.body.style.overflow = 'hidden'

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = overflow
    }
  }, [isOpen, onClose])

  return (
    <>
      {/* Fermeture au clavier assurée par la touche Échap, écoutée au niveau du document */}
      <div className={classNames(styles.overlay, { [styles.overlayOpen]: isOpen })} onClick={onClose} aria-hidden="true" />
      <div
        ref={panelRef}
        className={classNames(styles.drawer, { [styles.drawerOpen]: isOpen })}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-hidden={!isOpen}
        tabIndex={-1}
      >
        <div className={styles.header}>
          <h2 id={titleId} className={classNames(styles.title, 'fr-h6')}>
            {title}
          </h2>
          <Button priority="tertiary no outline" iconId="fr-icon-close-line" title="Fermer" onClick={onClose} size="small" />
        </div>
        <div className={styles.body}>{children}</div>
      </div>
    </>
  )
}
