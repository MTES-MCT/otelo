/**
 * Résumé publiable d'une erreur d'appel HTTP sortant.
 *
 * Journaliser une erreur axios telle quelle publie la requête entière, `config.headers`
 * compris — donc la clé d'API du service appelé. On ne garde que la réponse.
 */
export function describeHttpError(error: unknown): Record<string, unknown> {
  if (typeof error !== 'object' || error === null) {
    return { message: String(error) }
  }

  const candidate = error as {
    message?: unknown
    code?: unknown
    response?: { status?: unknown; statusText?: unknown; data?: unknown }
  }

  return {
    message: typeof candidate.message === 'string' ? candidate.message : undefined,
    code: candidate.code,
    status: candidate.response?.status,
    statusText: candidate.response?.statusText,
    body: candidate.response?.data,
  }
}
