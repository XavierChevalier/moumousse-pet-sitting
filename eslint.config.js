import eslintPluginAstro from 'eslint-plugin-astro'

export default [
  ...eslintPluginAstro.configs.recommended,
  {
    ignores: [
      'dist/**/*',
      'node_modules/**/*',
      'build/**/*',
      'coverage/**/*',
      'dist/**/*',
      '.idea/**/*',
      '.history/**/*',
      '.playwright-mcp/**/*',
      '.printables-temp/**/*',
      '.astro/**/*',
    ],
  },
]
