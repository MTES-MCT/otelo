import { permanentRedirect } from 'next/navigation'

/** Ancienne adresse de la page, conservée pour les signets et les liens déjà partagés. */
export default function LegacyUsersPage() {
  permanentRedirect('/admin/utilisateurs')
}
