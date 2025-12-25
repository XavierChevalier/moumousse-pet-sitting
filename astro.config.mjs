import sitemap from '@astrojs/sitemap'
import playformInline from '@playform/inline'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'astro/config'

// https://astro.build/config
export default defineConfig({
  site: 'https://moumousse-pet-sitting.fr',
  // Enforce a single URL format everywhere (avoid /cgv vs /cgv/ duplicates in GSC)
  trailingSlash: 'always',
  integrations: [
    sitemap({
      // These routes are intentionally DEV-only (they return 404 in prod) so they must not appear in sitemap.
      filter: (page) => {
        const pathname = page.startsWith('http') ? new URL(page).pathname : page
        return !['/flyer', '/flyer/', '/visit-card', '/visit-card/'].includes(pathname)
      },
    }),
    playformInline(),
  ],
  vite: {
    plugins: [tailwindcss()],
  },
})
