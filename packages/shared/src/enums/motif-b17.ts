export const MotifB17 = {
  Tout: 'Tout',
  Env: 'Env',
  Assis: 'Assis',
  Rappr: 'Rappr',
  Trois: 'Trois',
} as const

export type MotifB17 = (typeof MotifB17)[keyof typeof MotifB17]
