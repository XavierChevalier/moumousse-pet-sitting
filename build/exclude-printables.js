import { fileURLToPath } from 'node:url'
import { resolve } from 'node:path'
import { existsSync, rmSync, readdirSync, readFileSync, statSync } from 'node:fs'

/**
 * Astro integration to exclude printables from production build
 * 
 * OPTIMIZED VERSION with:
 * - Better performance (avoids reading all files)
 * - Better error handling
 * - More precise detection (avoids false positives)
 * - More informative logs
 * 
 * This approach remains reactive (post-build cleanup) because:
 * - Astro processes .astro components before Vite
 * - Vite hooks cannot easily exclude Astro components
 * - Page exclusion via astro:build:setup is already effective
 */
export function excludePrintables() {
  const printablesRoutes = ['/flyer', '/visit-card']
  
  // File patterns to remove (more precise than simple keywords)
  const filePatterns = [
    // Printable pages
    /flyer\.astro/,
    /visit-card\.astro/,
    // Printable components (full path to avoid false positives)
    /[\/\\]components[\/\\]printables[\/\\]/,
    /[\/\\]core[\/\\]printables[\/\\]/,
    // Behaviors specific to printables (match both path and filename)
    /[\/\\]behaviors[\/\\](dom-queries|panning|centering|ruler|toolbar|sidebar)\./,
    // Also match generated filenames that start with these behavior names
    /^(dom-queries|panning|centering|ruler|toolbar|sidebar)\./,
  ]
  
  // Content patterns to detect printable code in JS files
  // Uses more specific patterns to avoid false positives
  const contentPatterns = [
    /printables-(main|toolbar|sidebar)/,  // Specific IDs
    /data-(face-container|face-id|ruler)/, // Specific data attributes
    /PrintableDimensions|PrintablesToolbar|PrintablesSidebar|PrintableExportCard/, // Specific classes/types
    /setupPrintableExport|createPrintableDimensions/, // Specific functions
    // Detect imports of printable modules (minified or not)
    /(import|from).*dom-queries/,
    /(import|from).*panning/,
    /(import|from).*printables/,
  ]
  
  /**
   * Checks if a filename matches printables
   */
  function isPrintablesFile(filename) {
    return filePatterns.some(pattern => pattern.test(filename))
  }
  
  /**
   * Checks if a JS file's content contains printable code
   */
  function hasPrintablesContent(content) {
    if (!content || typeof content !== 'string') return false
    return contentPatterns.some(pattern => pattern.test(content))
  }
  
  /**
   * Recursively scans a directory and removes printable files
   * OPTIMIZED: only reads content for JS files
   */
  function removePrintablesFiles(dir, removedFiles = [], options = {}) {
    if (!existsSync(dir)) return removedFiles
    
    const { logger, maxFileSize = 1024 * 1024 } = options // 1MB max by default
    
    try {
      const entries = readdirSync(dir, { withFileTypes: true })
      
      for (const entry of entries) {
        const fullPath = resolve(dir, entry.name)
        
        if (entry.isDirectory()) {
          // Recursion for subdirectories
          removePrintablesFiles(fullPath, removedFiles, options)
        } else if (entry.isFile()) {
          // Filename check (fast)
          const nameMatches = isPrintablesFile(entry.name)
          
          // Content check only for JS files
          // and only if filename doesn't already match
          let contentMatches = false
          if (!nameMatches && entry.name.endsWith('.js')) {
            try {
              const stats = statSync(fullPath)
              // Avoid reading very large files (probably not printables)
              if (stats.size <= maxFileSize) {
                const content = readFileSync(fullPath, 'utf-8')
                contentMatches = hasPrintablesContent(content)
              }
            } catch (error) {
              // If we can't read the file, skip (permissions, etc.)
              if (logger) {
                logger.warn(`Could not read file ${fullPath}: ${error.message}`)
              }
            }
          }
          
          if (nameMatches || contentMatches) {
            try {
              rmSync(fullPath, { force: true })
              removedFiles.push(fullPath)
            } catch (error) {
              // Log the error instead of silently ignoring it
              if (logger) {
                logger.warn(`Failed to remove file ${fullPath}: ${error.message}`)
              }
            }
          }
        }
      }
    } catch (error) {
      if (logger) {
        logger.warn(`Error scanning directory ${dir}: ${error.message}`)
      }
    }
    
    return removedFiles
  }
  
  return {
    name: 'exclude-printables',
    hooks: {
      // Exclude pages before build
      'astro:build:setup': ({ pages, logger }) => {
        let excludedCount = 0
        for (const route of printablesRoutes) {
          const routesToRemove = [route, route + '/']
          
          for (const routeToRemove of routesToRemove) {
            if (pages.has(routeToRemove)) {
              pages.delete(routeToRemove)
              excludedCount++
              logger.info(`Excluded printable page from build: ${routeToRemove}`)
            }
          }
        }
        
        if (excludedCount === 0) {
          logger.debug('No printable pages found to exclude (may already be excluded)')
        }
      },
      
      // Clean up files and assets after build
      'astro:build:done': ({ dir, logger }) => {
        const distDir = fileURLToPath(dir)
        const removedItems = []
        
        // Remove printable assets
        const printablesAssetsDir = resolve(distDir, 'printables')
        if (existsSync(printablesAssetsDir)) {
          try {
            rmSync(printablesAssetsDir, { recursive: true, force: true })
            removedItems.push({ type: 'directory', path: printablesAssetsDir })
          } catch (error) {
            logger.warn(`Failed to remove printables assets: ${error.message}`)
          }
        }
        
        // Remove printable route directories
        for (const route of printablesRoutes) {
          const routeDir = resolve(distDir, route.replace('/', ''))
          if (existsSync(routeDir)) {
            try {
              rmSync(routeDir, { recursive: true, force: true })
              removedItems.push({ type: 'directory', path: routeDir })
            } catch (error) {
              logger.warn(`Failed to remove route directory ${route}: ${error.message}`)
            }
          }
        }
        
        // Remove printable JS files in _astro
        const astroDir = resolve(distDir, '_astro')
        if (existsSync(astroDir)) {
          const removedFiles = removePrintablesFiles(astroDir, [], { logger })
          removedItems.push(...removedFiles.map(path => ({ type: 'file', path })))
        }
        
        // Informative logs
        if (removedItems.length > 0) {
          const fileCount = removedItems.filter(item => item.type === 'file').length
          const dirCount = removedItems.filter(item => item.type === 'directory').length
          
          logger.info(
            `✓ Removed ${removedItems.length} printable item(s) from build ` +
            `(${fileCount} file(s), ${dirCount} directory/ies)`
          )
          
          // In debug mode, show details
          if (process.env.DEBUG || process.env.VERBOSE) {
            removedItems.forEach(item => {
              logger.debug(`  - ${item.type}: ${item.path}`)
            })
          }
        } else {
          logger.debug('✓ No printable files found in build (already clean)')
        }
      },
    },
  }
}
