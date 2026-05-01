import sitemap from '@astrojs/sitemap'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'astro/config'
import { excludePrintables } from './build/exclude-printables.js'

// https://astro.build/config
export default defineConfig({
  site: 'https://moumousse-pet-sitting.fr',
  // Enforce a single URL format everywhere (avoid /cgv/ vs /cgv duplicates in GSC)
  trailingSlash: 'never',
  integrations: [
    sitemap({
      // These routes are intentionally DEV-only (they return 404 in prod) so they must not appear in sitemap.
      filter: (page) => {
        const pathname = page.startsWith('http') ? new URL(page).pathname : page
        const withTrailingSlash = (path) => [path, `${path}/`]
        return !['/flyer', '/visit-card'].flatMap(withTrailingSlash).includes(pathname)
      },
    }),
    excludePrintables(),
  ],
  vite: {
    plugins: [tailwindcss()],
  },
})
