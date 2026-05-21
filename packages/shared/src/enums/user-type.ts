export const UserType = {
  DDT: 'DDT',
  AgenceUrbanisme: 'AgenceUrbanisme',
  Collectivite: 'Collectivite',
  DREAL: 'DREAL',
  BureauEtudes: 'BureauEtudes',
  Autre: 'Autre',
  Admin: 'Admin',
  AgenceDepartementale: 'AgenceDepartementale',
  BailleurSocialAgencePrivee: 'BailleurSocialAgencePrivee',
  Commune: 'Commune',
  EPCI: 'EPCI',
  OperateurRayonnementRegional: 'OperateurRayonnementRegional',
  SCOTPETR: 'SCOTPETR',
} as const

export type UserType = (typeof UserType)[keyof typeof UserType]

export const USER_TYPE_LABELS: Record<UserType, string> = {
  DDT: 'DDT',
  AgenceUrbanisme: "Agence d'urbanisme",
  Collectivite: 'Collectivité',
  DREAL: 'DREAL',
  BureauEtudes: "Bureau d'études",
  Autre: 'Autre',
  Admin: 'Admin',
  AgenceDepartementale: "Agence départementale (OPH, agence d'attractivité, ADIL)",
  BailleurSocialAgencePrivee: 'Bailleur Social & Agence privée',
  Commune: 'Commune',
  EPCI: 'EPCI',
  OperateurRayonnementRegional: 'Opérateur rayonnement régional',
  SCOTPETR: 'SCoT / PETR',
}

export const SELECTABLE_USER_TYPES = [
  UserType.Admin,
  UserType.AgenceDepartementale,
  UserType.AgenceUrbanisme,
  UserType.Autre,
  UserType.BailleurSocialAgencePrivee,
  UserType.BureauEtudes,
  UserType.Commune,
  UserType.DDT,
  UserType.DREAL,
  UserType.EPCI,
  UserType.OperateurRayonnementRegional,
  UserType.SCOTPETR,
] as const
