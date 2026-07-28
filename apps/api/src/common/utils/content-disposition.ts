// Caractères interdits dans un nom de fichier sous Windows/macOS.
const ILLEGAL_FILENAME_CHARS = /["\\/:*?<>|]/g
// Tout ce qui n'est pas de l'ASCII imprimable (caractères de contrôle inclus).
const NON_PRINTABLE_ASCII = /[^ -~]/g
// Marques diacritiques isolées par la décomposition NFD (l'accent de « é », etc.).
const COMBINING_MARKS = /[̀-ͯ]/g
// `encodeURIComponent` laisse passer ces caractères, exclus de `attr-char` (RFC 5987).
const NON_ATTR_CHARS = /['()*]/g

/**
 * Translittère un nom de fichier en ASCII imprimable : « Périgueux » → « Perigueux ».
 * Sert de repli pour les clients qui ne comprennent pas `filename*`.
 */
export function toAsciiFilename(filename: string): string {
  const sanitized = filename
    .normalize('NFD')
    .replace(COMBINING_MARKS, '')
    .replace(ILLEGAL_FILENAME_CHARS, ' ')
    .replace(NON_PRINTABLE_ASCII, '_')
    .replace(/\s+/g, ' ')
    .trim()

  return sanitized || 'export'
}

function encodeRfc5987(value: string): string {
  return encodeURIComponent(value).replace(NON_ATTR_CHARS, (char) => `%${char.charCodeAt(0).toString(16).toUpperCase()}`)
}

/**
 * Construit une valeur d'en-tête `Content-Disposition` supportant les accents.
 *
 * Un en-tête HTTP ne transporte que de l'ASCII : Node sérialise la valeur en latin1, ce qui
 * transforme les accents en mojibake côté navigateur (« Périgueux » → « PÃ©rigueux ») et casse
 * les caractères hors latin1. On émet donc les deux formes prévues par la RFC 6266 :
 * `filename=` translittéré pour les clients anciens, `filename*=UTF-8''…` percent-encodé que
 * tous les navigateurs actuels préfèrent.
 */
export function buildContentDisposition(filename: string, type: 'attachment' | 'inline' = 'attachment'): string {
  return `${type}; filename="${toAsciiFilename(filename)}"; filename*=UTF-8''${encodeRfc5987(filename)}`
}
