import { defineConfig, globalIgnores } from 'eslint/config';
import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTypescript from 'eslint-config-next/typescript';

export default defineConfig([
  ...nextVitals,
  ...nextTypescript,
  {
    rules: {
      // Preserve the exported SVGs and image sizing during the framework migration.
      '@next/next/no-img-element': 'off',
    },
  },
  globalIgnores(['.next/**', '.next-integration/**', '.private/**', 'src/generated/**', 'dist/**', 'out/**', 'next-env.d.ts']),
]);
