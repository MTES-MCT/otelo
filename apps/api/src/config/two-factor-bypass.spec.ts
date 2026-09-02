const loadModule = (value?: string) => {
  jest.resetModules()

  if (value === undefined) {
    delete process.env.TWO_FACTOR_BYPASS_EMAILS
  } else {
    process.env.TWO_FACTOR_BYPASS_EMAILS = value
  }

  return require('./two-factor-bypass')
}

describe('isTwoFactorBypassed', () => {
  const initialValue = process.env.TWO_FACTOR_BYPASS_EMAILS

  afterAll(() => {
    if (initialValue === undefined) {
      delete process.env.TWO_FACTOR_BYPASS_EMAILS
    } else {
      process.env.TWO_FACTOR_BYPASS_EMAILS = initialValue
    }
  })

  /**
   * Le cas qui compte le plus : sans variable, aucun compte ne doit être dispensé.
   * Une erreur ici retirerait la seconde authentification à tout le monde.
   */
  it('should bypass nobody when the variable is unset or empty', () => {
    expect(loadModule().isTwoFactorBypassed('agent@collectivite.fr')).toBe(false)
    expect(loadModule('').isTwoFactorBypassed('agent@collectivite.fr')).toBe(false)
    expect(loadModule('  ,  ,').isTwoFactorBypassed('agent@collectivite.fr')).toBe(false)
  })

  it('should bypass an exact address', () => {
    const { isTwoFactorBypassed } = loadModule('demo@otelo.test')
    expect(isTwoFactorBypassed('demo@otelo.test')).toBe(true)
    expect(isTwoFactorBypassed('autre@otelo.test')).toBe(false)
  })

  it('should bypass a whole domain', () => {
    const { isTwoFactorBypassed } = loadModule('@e2e.otelo.test')
    expect(isTwoFactorBypassed('scenario-1@e2e.otelo.test')).toBe(true)
    expect(isTwoFactorBypassed('scenario-2@e2e.otelo.test')).toBe(true)
    expect(isTwoFactorBypassed('agent@collectivite.fr')).toBe(false)
  })

  /**
   * Un domaine déclaré ne doit pas dispenser une adresse qui s'en approche : sans
   * l'arobase, `otelo.test` dispenserait aussi `mechant@evil-otelo.test`.
   */
  it('should not bypass a look-alike domain', () => {
    const { isTwoFactorBypassed } = loadModule('@otelo.test')
    expect(isTwoFactorBypassed('mechant@evil-otelo.test')).toBe(false)
    expect(isTwoFactorBypassed('mechant@otelo.test.fr')).toBe(false)
    expect(isTwoFactorBypassed('demo@otelo.test')).toBe(true)
  })

  it('should ignore casing and spacing', () => {
    const { isTwoFactorBypassed } = loadModule(' Demo@Otelo.Test , @E2E.otelo.test ')
    expect(isTwoFactorBypassed('DEMO@otelo.test')).toBe(true)
    expect(isTwoFactorBypassed('  demo@otelo.test  ')).toBe(true)
    expect(isTwoFactorBypassed('Scenario@e2e.OTELO.test')).toBe(true)
  })

  it('should accept several entries at once', () => {
    const { isTwoFactorBypassed } = loadModule('demo@otelo.test,@e2e.otelo.test')
    expect(isTwoFactorBypassed('demo@otelo.test')).toBe(true)
    expect(isTwoFactorBypassed('x@e2e.otelo.test')).toBe(true)
    expect(isTwoFactorBypassed('agent@collectivite.fr')).toBe(false)
  })
})
