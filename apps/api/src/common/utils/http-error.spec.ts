import { describeHttpError } from './http-error'

/** Une erreur axios porte `config.headers`, donc la clé d'API du service appelé. */
describe('describeHttpError', () => {
  /** Ce qu'`axios` lève sur un 401 de Brevo. */
  const axiosError = () =>
    Object.assign(new Error('Request failed with status code 401'), {
      code: 'ERR_BAD_REQUEST',
      config: {
        url: 'https://api.brevo.com/v3/smtp/email',
        method: 'post',
        headers: { accept: 'application/json', 'api-key': 'xkeysib-secret-a-ne-pas-journaliser', 'content-type': 'application/json' },
        data: '{"htmlContent":"<p>code 482917</p>"}',
      },
      response: { status: 401, statusText: 'Unauthorized', data: { message: 'Key not found' } },
    })

  it('should never carry the outgoing credentials', () => {
    const described = JSON.stringify(describeHttpError(axiosError()))

    expect(described).not.toContain('xkeysib-secret-a-ne-pas-journaliser')
    expect(described).not.toContain('api-key')
  })

  it('should not carry the request body either', () => {
    const described = JSON.stringify(describeHttpError(axiosError()))

    expect(described).not.toContain('482917')
  })

  it('should keep what makes the log diagnosable', () => {
    const described = describeHttpError(axiosError())

    expect(described.status).toBe(401)
    expect(described.statusText).toBe('Unauthorized')
    expect(described.code).toBe('ERR_BAD_REQUEST')
    expect(described.message).toBe('Request failed with status code 401')
    expect(described.body).toEqual({ message: 'Key not found' })
  })

  it('should cope with what is not an axios error', () => {
    expect(describeHttpError(new Error('réseau coupé')).message).toBe('réseau coupé')
    expect(describeHttpError('panne').message).toBe('panne')
    expect(describeHttpError(null).message).toBe('null')
    expect(describeHttpError(undefined).message).toBe('undefined')
  })
})
