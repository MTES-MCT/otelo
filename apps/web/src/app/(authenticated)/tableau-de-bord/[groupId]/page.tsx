import { redirect } from 'next/navigation'
import { TableauDeBord } from '~/components/tableau-de-bord/tableau-de-bord'
import { getSession } from '~/lib/auth/server'
import { getDashboardList } from '~/server-only/simulation/get-dashboard-list'
import type { GroupIdRouteParams } from '~/types/simulation-page-props'

export const dynamic = 'force-dynamic'

export default async function TableauDeBordPage({ params }: GroupIdRouteParams) {
  const { groupId } = await params

  // Redirect if no groupId is provided
  if (!groupId) {
    redirect('/tableaux-de-bord')
  }

  const session = await getSession()

  // Fetch simulations for the given group
  const dashboardGroups = await getDashboardList()

  const group = dashboardGroups.find((g) => g.id === groupId)

  if (!group) {
    redirect('/tableaux-de-bord')
  }

  return <TableauDeBord simulations={group.simulations} groupName={group.name} userEmail={session?.user?.email as string} />
}
