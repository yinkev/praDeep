import next from 'eslint-config-next/core-web-vitals'

const config = [
  {
    ignores: ['.next/**', 'node_modules/**', 'test-results/**'],
  },
  ...next,
  {
    rules: {
      'react/no-unescaped-entities': 'warn',
      'react-hooks/set-state-in-effect': 'warn',
      'react-hooks/preserve-manual-memoization': 'warn',
      'react-hooks/static-components': 'warn',
    },
  },
]

export default config
