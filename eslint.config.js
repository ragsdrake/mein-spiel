// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ['dist/*'],
  },
  {
    // react-three-fiber JSX uses three.js props (position, args, …) unknown to React DOM
    files: ['components/scene/**/*.js'],
    rules: { 'react/no-unknown-property': 'off' },
  },
]);
