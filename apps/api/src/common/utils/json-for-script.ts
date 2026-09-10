/**
 * Sérialise une valeur destinée à un bloc `<script>`.
 *
 * `JSON.stringify` n'échappe ni `<` — une valeur contenant `</script>` refermerait le
 * bloc — ni U+2028/U+2029, valides en JSON mais interdits dans un littéral JavaScript.
 * Le repli `'undefined'` reproduit ce que produisait l'interpolation directe.
 */
export function jsonForScript(value: unknown): string {
  const json = JSON.stringify(value)

  if (json === undefined) {
    return 'undefined'
  }

  return json
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029')
}
