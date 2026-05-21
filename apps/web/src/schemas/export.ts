import { ZEpci } from '@shared'
import z from 'zod'

export const ZRequestPowerpoint = z
  .object({
    nextStep: z.string().min(1, { message: 'Veuillez sélectionner la prochaine étape' }),
    resultDate: z
      .string()
      .min(1, { message: 'Veuillez sélectionner une date' })
      .refine(
        (val) => {
          const selectedDate = new Date(val)
          const today = new Date()
          today.setHours(0, 0, 0, 0)
          return selectedDate >= today
        },
        { message: "La date ne peut pas être antérieure à aujourd'hui" },
      ),
    selectedSimulations: z
      .array(z.string())
      .min(1, { message: 'Veuillez sélectionner au moins 1 simulation' })
      .max(3, { message: 'Vous ne pouvez sélectionner que 3 simulations maximum' }),
    privilegedSimulation: z.string().min(1, { message: 'Veuillez sélectionner un scénario privilégié' }),
    documentType: z.string().min(1, { message: 'Veuillez sélectionner un type de document' }),
    periodStart: z
      .string()
      .regex(/^\d{4}$/, { message: 'Veuillez entrer une année valide (YYYY)' })
      .refine((val) => parseInt(val) >= 2020, { message: "L'année de début doit être supérieure ou égale à 2020" }),
    periodEnd: z
      .string()
      .regex(/^\d{4}$/, { message: 'Veuillez entrer une année valide (YYYY)' })
      .refine((val) => parseInt(val) <= 2050, { message: "L'année de fin ne peut pas être supérieure à 2050" }),
    epci: z
      .object({
        code: z.string(),
        name: z.string().min(1, { message: 'Veuillez sélectionner un EPCI' }),
      })
      .optional(),
    epcis: z.array(ZEpci).optional(),
    privilegedSimulationProjection: z.number().optional(),
  })
  .superRefine((data, ctx) => {
    const startYear = parseInt(data.periodStart)
    const endYear = parseInt(data.periodEnd)

    if (startYear > endYear) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "L'année de début ne peut pas être supérieure à l'année de fin",
        path: ['periodStart'],
      })
    }

    if (endYear < startYear) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "L'année de fin ne peut pas être inférieure à l'année de début",
        path: ['periodEnd'],
      })
    }

    if (startYear === endYear) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Les années de début et de fin doivent être différentes',
        path: ['periodEnd'],
      })
    }

    // Check if endYear is not greater than privileged simulation projection
    if (data.privilegedSimulationProjection && endYear > data.privilegedSimulationProjection) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `L'année de fin ne peut pas être supérieure à la projection du scénario privilégié (${data.privilegedSimulationProjection})`,
        path: ['periodEnd'],
      })
    }

    // Ensure only one of epci or epcis is provided
    const hasEpci = data.epci && data.epci.name
    const hasEpcis = data.epcis && data.epcis.length > 0

    if (hasEpci && hasEpcis) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Vous ne pouvez pas sélectionner à la fois un EPCI unique et plusieurs EPCIs',
        path: ['epci'],
      })
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Vous ne pouvez pas sélectionner à la fois un EPCI unique et plusieurs EPCIs',
        path: ['epcis'],
      })
    }

    // For SCoT documents, require multiple EPCIs selection
    if (data.documentType === 'SCoT') {
      if (!data.epcis || data.epcis.length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Veuillez sélectionner au moins un EPCI pour un document SCoT',
          path: ['epcis'],
        })
      }
    } else {
      // For other document types, use single EPCI selection
      if (!!data.epci && !data.epci?.name) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Veuillez sélectionner un EPCI',
          path: ['epci'],
        })
      }
    }
  })

export type TRequestPowerpoint = z.infer<typeof ZRequestPowerpoint>
