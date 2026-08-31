import { buildContentDisposition, toAsciiFilename } from './content-disposition'

describe('toAsciiFilename', () => {
  it('translittère les accents', () => {
    expect(toAsciiFilename('Votre scenario Otelo - CA Le Grand Périgueux - été.xlsx')).toBe(
      'Votre scenario Otelo - CA Le Grand Perigueux - ete.xlsx',
    )
  })

  it('remplace les caractères interdits dans un nom de fichier', () => {
    expect(toAsciiFilename('rapport 2024/2025 : "final"?.xlsx')).toBe('rapport 2024 2025 final .xlsx')
  })

  it('remplace les caractères non translittérables', () => {
    expect(toAsciiFilename('scénario 東京.xlsx')).toBe('scenario __.xlsx')
  })

  it('retombe sur un nom générique si tout est retiré', () => {
    expect(toAsciiFilename('///')).toBe('export')
  })
})

describe('buildContentDisposition', () => {
  it('émet les deux formes de la RFC 6266', () => {
    expect(buildContentDisposition('Périgueux.xlsx')).toBe('attachment; filename="Perigueux.xlsx"; filename*=UTF-8\'\'P%C3%A9rigueux.xlsx')
  })

  it('encode les caractères hors attr-char', () => {
    expect(buildContentDisposition("l'été (2024).xlsx")).toBe(
      "attachment; filename=\"l'ete (2024).xlsx\"; filename*=UTF-8''l%27%C3%A9t%C3%A9%20%282024%29.xlsx",
    )
  })

  it('ne produit que de l’ASCII imprimable', () => {
    expect(buildContentDisposition('Scénario « Périgueux » — 2030.xlsx')).toMatch(/^[ -~]+$/)
  })
})
