import sitemap from '@astrojs/sitemap'
import playformInline from '@playform/inline'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'astro/config'

// https://astro.build/config
export default defineConfig({
  site: 'https://moumousse-pet-sitting.fr',
  integrations: [sitemap(), playformInline()],
  vite: {
    plugins: [tailwindcss()],
  },
})
