import nextCoreWebVitals from 'eslint-config-next/core-web-vitals'

const config = [
  {
    ignores: [
      'node_modules/**',
      '.next/**',
      'coverage/**',
      'safe_copy/**',
      'docs/**',
      'kmb_docs_for_decsoft/**',
      'next-env.d.ts',
    ],
  },
  ...nextCoreWebVitals,
]

export default config
