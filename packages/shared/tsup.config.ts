import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/index.ts', 'src/enums/index.ts', 'src/schemas/index.ts'],
  format: ['esm', 'cjs'],
  dts: true,
  clean: true,
  sourcemap: true,
  splitting: false,
})
