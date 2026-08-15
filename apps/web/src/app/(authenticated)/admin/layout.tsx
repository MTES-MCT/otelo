import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { AdminNavigation } from '~/components/admin/shared/admin-navigation'
import { getSession } from '~/lib/auth/server'
import styles from './admin.module.css'

export const metadata: Metadata = {
  robots: { follow: false, index: false },
  title: 'Administration — Otelo',
}

/**
 * Coquille d'administration : garde de rôle + navigation latérale.
 *
 * La session et l'accès sont déjà vérifiés par le layout authentifié parent ; ce layout
 * n'ajoute que le contrôle de rôle, en un seul endroit plutôt que répété dans chaque page.
 *
 * Un utilisateur connecté sans le rôle ADMIN reçoit un 404 et non un 403 : l'existence
 * même de l'espace d'administration n'a pas à être révélée.
 */
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession()

  if (!session || session.user.role !== 'ADMIN') {
    notFound()
  }

  return (
    <div className={styles.shell}>
      <AdminNavigation />
      <div className={styles.content}>{children}</div>
    </div>
  )
}
