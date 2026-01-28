export const SourceB15 = {
  RP: 'RP',
  Filo: 'Filo',
} as const

export type SourceB15 = (typeof SourceB15)[keyof typeof SourceB15]
