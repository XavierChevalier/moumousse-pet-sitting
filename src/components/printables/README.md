# 📄 Système de Printables

Ce dossier contient le système complet de génération et d'export de documents imprimables (cartes de visite, flyers, etc.) pour Moumousse Pet Sitting.

## 🎯 Vue d'ensemble

Le système de printables permet de :

- **Créer** des documents imprimables avec dimensions précises (mm, DPI)
- **Prévisualiser** les documents avec repères de coupe (crop marks)
- **Exporter** en PNG haute résolution pour l'impression
- **Gérer** les zones de sécurité, bleed, et marges

## 📁 Structure

```
printables/
├── behaviors/          # Comportements interactifs (panning, centering, toolbar, etc.)
├── export/             # Système d'export complet
│   ├── core/          # Logique métier (exporter, cropper, calculator)
│   ├── services/      # Services (fonts, text outline, notifications)
│   └── ui/            # Composants UI (preview, download, buttons)
├── visit-card/        # Composants de carte de visite (85×54mm)
├── flyer/             # Composants de flyer (99×210mm plié, 198×210mm ouvert)
├── PrintableExportCard.astro      # Conteneur pour un printable avec overlay
├── PrintableDimensionsPanel.astro # Panneau d'affichage des dimensions
├── PrintablesToolbar.astro        # Barre d'outils (export, preview, etc.)
├── PrintablesSidebar.astro         # Barre latérale (navigation entre faces)
└── Ruler.astro                    # Règle de mesure
```

## 🔧 Composants principaux

### `PrintableExportCard.astro`

Conteneur principal pour un printable. Gère :

- L'affichage du contenu avec marges
- L'overlay des repères de coupe (crop marks)
- Les dimensions via data attributes

**Props :**

- `targetId` : ID unique de l'élément à exporter
- `dimensions` : Objet `PrintableDimensions` avec toutes les dimensions
- `overlaySrc` : Chemin vers l'image overlay (repères de coupe)
- `visible` : Affiche/masque le printable

### `PrintablesToolbar.astro`

Barre d'outils en haut de la page avec :

- Boutons d'export (avec/sans repères de coupe)
- Toggle de prévisualisation
- Navigation entre faces (recto/verso)

### `PrintablesSidebar.astro`

Barre latérale pour naviguer entre les différentes faces d'un document.

## 📐 Système de dimensions

Le système utilise `createPrintableDimensions()` pour calculer toutes les dimensions nécessaires.

### Concepts clés

- **Trim size (finished)** : Taille finale après découpe (ex: 85×54mm pour carte de visite)
- **Bleed** : Zone supplémentaire par côté pour éviter les bords blancs (ex: 2mm)
- **Safe zone** : Zone de sécurité où le contenu important ne doit pas être coupé (ex: 3mm depuis le bord fini)
- **Page size** : Taille totale de la page d'impression (trim + bleed + marges)
- **DPI** : Résolution d'export (ex: 600 DPI = 300 base × 2 multiplier)

### Exemple

```typescript
import { createPrintableDimensions } from '../../core/printables/dimensions'

const dimensions = createPrintableDimensions({
  dpiMultiplier: 2, // 600 DPI final (300 × 2)
  baseDpi: 300,
  finishedWidthMm: 85, // Finished trim width
  finishedHeightMm: 54,
  bleedMm: 2, // 2mm bleed per side
  safeZoneMm: 3, // 3mm safe zone per side
  contentPaddingMm: 4, // Inner padding
  baseTargetWidthPx: 1347, // Target width in pixels
  baseTargetHeightPx: 981,
})
```

## 🚀 Système d'export

### Initialisation

Le système d'export est initialisé via `setupPrintableExport()` :

```typescript
import { setupPrintableExport } from '../components/printables/export/export-controller'

const cleanup = setupPrintableExport(dimensions)
```

### Fonctionnement

1. **Détection des boutons** : Event delegation sur les boutons avec `data-target` et `data-filename`
2. **Préparation** :
   - Chargement des polices
   - Normalisation des contours de texte (text-outline)
   - Gestion de la visibilité des repères de coupe
3. **Export** :
   - Conversion HTML → PNG via `html-to-image`
   - Recadrage pour export final (sans repères)
   - Génération du fichier PNG
4. **Téléchargement** : Téléchargement automatique ou prévisualisation

### Boutons d'export

Pour créer un bouton d'export, utilisez ces attributs data :

```html
<button
  data-target="card-recto"           <!-- ID de l'élément à exporter -->
  data-filename="carte-visite-recto"  <!-- Nom du fichier (sans extension) -->
  data-with-overlay="true"            <!-- true = avec repères, false = sans -->
>
  Exporter avec repères
</button>
```

### Export final vs avec repères

- **Avec repères** (`data-with-overlay="true"`) : Export de la page complète avec repères de coupe
- **Sans repères** (`data-with-overlay="false"`) : Export recadré sur la zone finie uniquement

## 🎨 Gestion des polices

Le système charge automatiquement les polices utilisées dans le printable avant l'export pour garantir un rendu correct.

## 🔍 Prévisualisation

Un système de prévisualisation permet de voir l'export avant téléchargement :

- Toggle dans la toolbar
- Modal avec l'image générée
- Bouton de téléchargement depuis la prévisualisation

## 📝 Créer un nouveau printable

1. **Créer le composant** dans un sous-dossier (ex: `new-printable/`)
2. **Définir les dimensions** dans la page Astro
3. **Utiliser `PrintableExportCard`** pour wrapper le contenu
4. **Ajouter les boutons d'export** dans la toolbar
5. **Ajouter la face** dans le sidebar si multi-faces

### Exemple minimal

```astro
---
// pages/new-printable.astro
import { createPrintableDimensions } from '../core/printables/dimensions'
import PrintableExportCard from '../components/printables/PrintableExportCard.astro'
import PrintablesToolbar from '../components/printables/PrintablesToolbar.astro'

const dimensions = createPrintableDimensions({
  dpiMultiplier: 2,
  baseDpi: 300,
  finishedWidthMm: 100,
  finishedHeightMm: 50,
  bleedMm: 2,
  safeZoneMm: 3,
  contentPaddingMm: 4,
  baseTargetWidthPx: 1500,
  baseTargetHeightPx: 750,
})
---

<PrintablesToolbar dimensions={dimensions} currentPage="new-printable" />

<main>
  <PrintableExportCard
    targetId="new-printable-recto"
    dimensions={dimensions}
    overlaySrc="/printables/overlay.png"
  >
    <!-- Votre contenu ici -->
  </PrintableExportCard>
</main>
```

## 🛠️ Services et utilitaires

### `FontService`

Gère le chargement et l'embedding des polices pour l'export.

### `TextOutlineNormalizer`

Normalise les éléments avec `text-outline` pour un rendu correct à l'export.

### `CropCoordinatesCalculator`

Calcule les coordonnées de recadrage pour l'export final.

### `CanvasCropper`

Recadre l'image exportée sur la zone finie.

## ⚠️ Notes importantes

- Les pages printables sont **uniquement disponibles en mode développement** (`import.meta.env.DEV`)
- Les printables sont **exclus du build de production** via `build/exclude-printables.js`
- Les dimensions doivent être **cohérentes** entre le CSS et les paramètres de `createPrintableDimensions`
- Le système utilise **html-to-image** chargé dynamiquement depuis un CDN

## 📚 Documentation des printables spécifiques

- [Carte de visite](./visit-card/README.md) - 85×54mm
- [Flyer](./flyer/README.md) - 99×210mm plié, 198×210mm ouvert
