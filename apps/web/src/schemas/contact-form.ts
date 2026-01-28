import { z } from 'zod'

export const ZContactForm = z.object({
  consent: z.boolean().refine((val) => val === true, {
    message: 'Vous devez accepter le traitement de vos données personnelles',
  }),
  email: z.string().min(1, "L'adresse e-mail est obligatoire").email('Veuillez saisir une adresse e-mail valide'),
  firstname: z.string().min(1, 'Le prénom est obligatoire'),
  lastname: z.string().min(1, 'Le nom de famille est obligatoire'),
  message: z.string().min(10, 'Le message doit contenir au moins 10 caractères'),
  subject: z.string().min(1, "L'objet de la demande est obligatoire"),
})

export type TContactForm = z.infer<typeof ZContactForm>
