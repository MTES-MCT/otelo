export const SourceB14 = {
  RP: 'RP',
  Filo: 'Filo',
  FF: 'FF',
} as const

export type SourceB14 = (typeof SourceB14)[keyof typeof SourceB14]
