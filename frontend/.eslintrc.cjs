import globals from 'globals';
import js from '@eslint/js';

export default [
  { files: ['**/*.{js,mjs,cjs,jsx}'], languageOptions: { globals: globals.browser, parserOptions: { ecmaFeatures: { jsx: true } } } },
];
