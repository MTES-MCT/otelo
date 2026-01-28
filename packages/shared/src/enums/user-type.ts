export const UserType = {
  DDT: 'DDT',
  AgenceUrbanisme: 'AgenceUrbanisme',
  Collectivite: 'Collectivite',
  DREAL: 'DREAL',
  BureauEtudes: 'BureauEtudes',
  Autre: 'Autre',
} as const

export type UserType = (typeof UserType)[keyof typeof UserType]
