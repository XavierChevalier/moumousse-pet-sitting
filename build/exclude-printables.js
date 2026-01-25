import { fileURLToPath } from 'node:url'
import { resolve } from 'node:path'
import { existsSync, rmSync, readdirSync } from 'node:fs'

/**
 * Astro integration to exclude printables from production build
 * 
 * This integration:
 * 1. Excludes printable pages from the Map before build (astro:build:setup)
 * 2. Cleans up printable assets and JS files after build (astro:build:done)
 * 
 * Required because:
 * - Assets from public/printables/ are automatically copied by Astro
 * - JS files from printable components are generated even if pages are not built
 */
export function excludePrintables() {
  const printablesRoutes = ['/flyer', '/visit-card']
  
  return {
    name: 'exclude-printables',
    hooks: {
      // Exclude printable pages from the Map before build
      'astro:build:setup': ({ pages, logger }) => {
        for (const route of printablesRoutes) {
          // Remove with and without trailing slash
          const routesToRemove = [route, route + '/']
          
          for (const routeToRemove of routesToRemove) {
            if (pages.has(routeToRemove)) {
              pages.delete(routeToRemove)
              logger.info(`Excluded printable page from build: ${routeToRemove}`)
            }
          }
        }
      },
      
      // Clean up printable assets and JS files after build
      'astro:build:done': ({ dir }) => {
        const distDir = fileURLToPath(dir)
        let removedCount = 0
        
        // Remove printable assets (copied from public/printables/)
        const printablesAssetsDir = resolve(distDir, 'printables')
        if (existsSync(printablesAssetsDir)) {
          rmSync(printablesAssetsDir, { recursive: true, force: true })
          removedCount++
        }
        
        // Remove JS files from printable pages and their components
        const astroDir = resolve(distDir, '_astro')
        if (existsSync(astroDir)) {
          try {
            const files = readdirSync(astroDir)
            for (const file of files) {
              if (file.includes('flyer.astro') || file.includes('visit-card.astro') || 
                  file.includes('printables') || file.includes('Printables')) {
                const filePath = resolve(astroDir, file)
                rmSync(filePath, { force: true })
                removedCount++
              }
            }
          } catch (error) {
            // Ignore errors
          }
        }
        
        if (removedCount > 0) {
          console.log(`✓ ${removedCount} printable file(s) removed from build`)
        }
      },
    },
  }
}
