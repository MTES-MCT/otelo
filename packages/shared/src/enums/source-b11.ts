export const SourceB11 = {
  RP: 'RP',
  SNE: 'SNE',
} as const

export type SourceB11 = (typeof SourceB11)[keyof typeof SourceB11]
