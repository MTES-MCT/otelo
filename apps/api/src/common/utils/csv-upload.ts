/**
 * Types MIME acceptés pour un import CSV. `application/vnd.ms-excel` en fait partie :
 * Windows l'associe aux `.csv`.
 *
 * L'en-tête vient du client et se falsifie : cette liste sert à refuser tôt, pas à faire
 * confiance. Le contenu reste validé en aval.
 */
export const ACCEPTED_CSV_MIMETYPES = ['text/csv', 'application/csv', 'application/vnd.ms-excel']
