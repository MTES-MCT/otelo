// Type definitions for Prisma JSON fields
// These types are used by prisma-json-types-generator

declare global {
  // biome-ignore lint/style/noNamespace: needed for json prisma generator
  namespace PrismaJson {
    // Type for DemographicEvolutionOmphaleCustom.data field
    type OmphaleCustomData = {
      year: number
      value: number
    }[]
  }
}

export {}
