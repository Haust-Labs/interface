/* eslint-env node */

require('@uniswap/eslint-config/load');

module.exports = {
  extends: '@uniswap/eslint-config/react',
  overrides: [
    {
      // Configuration/typings typically export objects/definitions that are used outside of the transpiled package
      // (eg not captured by the tsconfig). Because it's typical and not exceptional, this is turned off entirely.
      files: ['**/*.config.*', '**/*.d.ts'],
      rules: {
        'import/no-unused-modules': 'off',
      },
    },
    {
      files: ['**/*.ts', '**/*.tsx'],
      rules: {
        'import/no-restricted-paths': [
          'error',
          {
            zones: [
              {
                target: ['src/**/*[!.test].ts', 'src/**/*[!.test].tsx'],
                from: 'src/test-utils',
              },
            ],
          },
        ],
        'no-restricted-imports': [
          'error',
          {
            paths: [
              {
                name: 'moment',
                // tree-shaking for moment is not configured because it degrades performance - see craco.config.cjs.
                message:
                  'moment is not configured for tree-shaking. If you use it, update the Webpack configuration.',
              },
              {
                name: 'zustand',
                importNames: ['default'],
                message:
                  'Default import from zustand is deprecated. Import `{ create }` instead.',
              },
            ],
          },
        ],
      },
    },
  ],
  rules: {
    'import/no-unused-modules': 'off',
    'prettier/prettier': [
      'off',
      {
        endOfLine: 'auto',
        semi: true,
        singleQuote: true,
        bracketSpacing: false,
      },
    ],
  },
};
