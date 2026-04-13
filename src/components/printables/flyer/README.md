# 📄 Flyer - Moumousse Pet Sitting

## 📐 Spécifications

- **Format plié** : 99×210 mm (A4 plié en 3)
- **Format ouvert** : 198×210 mm
- **Bleed** : 2 mm par côté
- **Zone de sécurité** : 3 mm depuis le bord fini
- **Résolution d'export** : 600 DPI (300 base × 2)

## 📁 Composants

### `FlyerFace1-4.astro`

Face extérieure du flyer (visible quand plié) avec :

- Design principal
- Informations essentielles
- Call-to-action

**Props :**

- `withBleed` : Affiche les zones de bleed (pour l'export)

### `FlyerFace2-3.astro`

Face intérieure du flyer (visible quand ouvert) avec :

- Contenu détaillé
- Services proposés
- Informations complètes

**Props :**

- `withBleed` : Affiche les zones de bleed (pour l'export)

## 🚀 Utilisation

Le flyer est accessible sur `/flyer` en mode développement uniquement.

### Export

Deux modes d'export disponibles :

1. **Avec repères de coupe** : Pour l'impression avec repères
2. **Sans repères** : Export final recadré sur la zone finie

### Dimensions calculées

```typescript
const dimensions = createPrintableDimensions({
  dpiMultiplier: 2,
  baseDpi: 300,
  finishedWidthMm: 99, // Folded trim width
  finishedHeightMm: 210,
  bleedMm: 2,
  safeZoneMm: 3,
  contentPaddingMm: 4,
  baseTargetWidthPx: 1169,
  baseTargetHeightPx: 2480,
})
```

## 📝 Notes

- Le flyer est conçu pour être plié en 3 parties
- Les deux faces sont exportables séparément
- Le système gère automatiquement les marges et le centrage
- Les polices sont chargées automatiquement avant l'export
