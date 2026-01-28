export type SimulationPageParams = Promise<{ id: string }>

export type SimulationPageProps = {
  params: SimulationPageParams
}

export type SimulationLayoutProps = {
  children: React.ReactNode
  params: SimulationPageParams
}

// API Route params types
export type IdRouteParams = { params: Promise<{ id: string }> }
export type CodeRouteParams = { params: Promise<{ code: string }> }
export type EpciRouteParams = { params: Promise<{ epci: string }> }
export type GroupIdRouteParams = { params: Promise<{ groupId: string }> }
