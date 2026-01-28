export const B15Surocc = {
  Acc: 'Acc',
  Mod: 'Mod',
} as const

export type B15Surocc = (typeof B15Surocc)[keyof typeof B15Surocc]
