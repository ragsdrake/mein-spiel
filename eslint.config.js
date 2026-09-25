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
    files: ['components/scene/**/*.js', 'components/stylelab/**/*.js', 'components/spec/**/*.js', 'app/export.js'],
    rules: { 'react/no-unknown-property': 'off' },
  },
  {
    // Node build scripts (sprite pipeline)
    files: ['tools/**/*.js'],
    languageOptions: { globals: { Buffer: 'readonly', process: 'readonly', __dirname: 'readonly' } },
  },
]);
