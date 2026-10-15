const expoConfig = require('eslint-config-expo/flat');

module.exports = [
  ...expoConfig,
  {
    rules: {
      'react-hooks/refs': 'warn',
      'react-hooks/set-state-in-effect': 'warn',
      '@typescript-eslint/no-unused-vars': [
        'warn',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      '@typescript-eslint/array-type': 'off',
    },
    ignores: [
      'node_modules/**',
      'dist/**',
      '.expo/**',
      'backend/**',
      'android/**',
      'public/**',
      'babel.config.js',
      'eslint.config.js',
    ],
  },
];
