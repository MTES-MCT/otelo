import { z } from 'zod'
import { parseUrbanismeDocType } from '~/utils/epci-group-name'

/**
 * Réponse à « Travaillez-vous sur un document d'urbanisme ? », telle que l'URL la porte.
 *
 * La question est obligatoire ; sur « Oui », le type de document l'est aussi, et le nom du document
 * pour un PLH ou un PLUi — les seuls dont le nom sert à nommer le groupe d'EPCI.
 */
export const ZUrbanismeDoc = z
  .object({
    urbanismeDoc: z.enum(['oui', 'non'], { message: 'Répondez à cette question pour continuer.' }),
    urbanismeDocType: z.string().nullable(),
    urbanismeDocName: z.string().nullable(),
  })
  .superRefine(({ urbanismeDoc, urbanismeDocType, urbanismeDocName }, ctx) => {
    if (urbanismeDoc !== 'oui') return

    if (!parseUrbanismeDocType(urbanismeDocType)) {
      ctx.addIssue({ code: 'custom', message: 'Choisissez un type de document pour continuer.', path: ['urbanismeDocType'] })
      return
    }

    if (urbanismeDocType === 'plh-plui' && !urbanismeDocName?.trim()) {
      ctx.addIssue({ code: 'custom', message: 'Renseignez le nom du document pour continuer.', path: ['urbanismeDocName'] })
    }
  })

export type TUrbanismeDocErrors = Partial<Record<'urbanismeDoc' | 'urbanismeDocType' | 'urbanismeDocName', string>>

/** Valide la réponse et renvoie le premier message d'erreur de chaque champ ; objet vide si la réponse est complète. */
export const validateUrbanismeDoc = (values: {
  urbanismeDoc: string | null
  urbanismeDocType: string | null
  urbanismeDocName: string | null
}): TUrbanismeDocErrors => {
  const result = ZUrbanismeDoc.safeParse(values)
  if (result.success) return {}

  const errors: TUrbanismeDocErrors = {}
  for (const issue of result.error.issues) {
    const field = issue.path[0] as keyof TUrbanismeDocErrors
    errors[field] ??= issue.message
  }
  return errors
}
