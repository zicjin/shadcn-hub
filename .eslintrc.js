module.exports = {
  root: true,
  env: {
    node: true,
    es2022: true,
  },
  extends: [
    'eslint:recommended',
    '@typescript-eslint/recommended',
    '@typescript-eslint/recommended-requiring-type-checking',
    'prettier',
  ],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
    project: ['./backend/tsconfig.json', './frontend/tsconfig.json'],
    tsconfigRootDir: __dirname,
  },
  plugins: ['@typescript-eslint'],
  rules: {
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    '@typescript-eslint/explicit-function-return-type': 'error',
    '@typescript-eslint/no-explicit-any': 'error',
    '@typescript-eslint/prefer-const': 'error',
    '@typescript-eslint/no-floating-promises': 'error',
    'prefer-const': 'error',
    'no-var': 'error',
    'object-shorthand': 'error',
  },
  overrides: [
    {
      files: ['frontend/**/*'],
      env: {
        browser: true,
        es2022: true,
      },
      extends: [
        'eslint:recommended',
        '@typescript-eslint/recommended',
        'plugin:react/recommended',
        'plugin:react-hooks/recommended',
        'plugin:jsx-a11y/recommended',
        'prettier',
      ],
      plugins: ['react', 'react-hooks', 'jsx-a11y'],
      settings: {
        react: {
          version: 'detect',
        },
      },
      rules: {
        'react/react-in-jsx-scope': 'off',
        'react/prop-types': 'off',
        'jsx-a11y/click-events-have-key-events': 'warn',
        'jsx-a11y/no-noninteractive-element-interactions': 'warn',
      },
    },
    {
      files: ['backend/**/*'],
      env: {
        node: true,
        es2022: true,
      },
      rules: {
        '@typescript-eslint/no-var-requires': 'error',
      },
    },
    {
      files: ['**/*.test.ts', '**/*.test.tsx', '**/*.spec.ts', '**/*.spec.tsx'],
      env: {
        jest: true,
      },
      extends: ['plugin:jest/recommended'],
      plugins: ['jest'],
    },
  ],
};