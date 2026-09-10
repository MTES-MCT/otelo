import { chartJsBundle, chartJsScriptTag } from './chart-runtime'

/** Le bundle est lu dans les dépendances, et non chargé depuis un CDN. */
describe('chartJsBundle', () => {
  it('should resolve the bundle from the project dependencies', () => {
    const bundle = chartJsBundle()

    expect(bundle.length).toBeGreaterThan(100_000)
    expect(bundle).toContain('Chart')
  })

  it('should read the file once and reuse it', () => {
    expect(chartJsBundle()).toBe(chartJsBundle())
  })

  it('should produce a self-contained script tag, with no outgoing request', () => {
    const tag = chartJsScriptTag()

    expect(tag.startsWith('<script>')).toBe(true)
    expect(tag.endsWith('</script>')).toBe(true)
    expect(tag).not.toContain('src=')
    expect(tag).not.toContain('cdn.jsdelivr.net')
  })
})
