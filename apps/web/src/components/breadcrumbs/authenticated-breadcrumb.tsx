'use client'

import { usePathname } from 'next/navigation'
import { AdminBreadcrumb } from '~/components/admin/admin-breadcrumb'
import { CreateSimulationBreadcrumb } from '~/components/simulations/breadcrumbs/create-simulation-breadcrumb'
import { UpdateSimulationBreadcrumb } from '~/components/simulations/breadcrumbs/modify-simulation-breadcrumb'

type BreadcrumbPaths = 'admin' | 'simulation' | 'modifier'

export const AuthenticatedBreadcrumb = () => {
  const pathname = usePathname()
  const breadcrumbComponents: Record<BreadcrumbPaths, React.ReactElement | null> = {
    admin: <AdminBreadcrumb />,
    simulation: <CreateSimulationBreadcrumb />,
    modifier: <UpdateSimulationBreadcrumb />,
  }

  const excludedPatterns = ['/resultats']

  const shouldExclude = excludedPatterns.some((pattern) => pathname?.includes(pattern))

  if (shouldExclude) {
    return null
  }

  const matchingPath = Object.keys(breadcrumbComponents).filter((path) => pathname?.includes(path)) as BreadcrumbPaths[]
  const lastPath = matchingPath[matchingPath.length - 1]

  return matchingPath ? <>{breadcrumbComponents[lastPath]}</> : null
}
