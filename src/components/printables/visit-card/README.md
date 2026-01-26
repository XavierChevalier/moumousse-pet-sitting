# 🎴 Carte de visite - Moumousse Pet Sitting

## 📐 Spécifications

- **Format fini** : 85×54 mm (format carte de crédit standard)
- **Bleed** : 2 mm par côté
- **Zone de sécurité** : 3 mm depuis le bord fini
- **Résolution d'export** : 600 DPI (300 base × 2)

## 📁 Composants

### `VisitCardRecto.astro`
Face recto de la carte de visite avec :
- Logo et nom "Moumousse Pet Sitting"
- Informations de contact (email, téléphone protégé)
- Réseaux sociaux

**Props :**
- `withBleed` : Affiche les zones de bleed (pour l'export)

### `VisitCardVerso.astro`
Face verso de la carte de visite avec :
- Informations complémentaires
- QR code (si applicable)
- Design complémentaire

**Props :**
- `withBleed` : Affiche les zones de bleed (pour l'export)

## 🚀 Utilisation

La carte de visite est accessible sur `/visit-card` en mode développement uniquement.

### Export

Deux modes d'export disponibles :
1. **Avec repères de coupe** : Pour l'impression avec repères
2. **Sans repères** : Export final recadré sur la zone 85×54mm

### Dimensions calculées

```typescript
const dimensions = createPrintableDimensions({
  dpiMultiplier: 2,
  baseDpi: 300,
  finishedWidthMm: 85,
  finishedHeightMm: 54,
  bleedMm: 2,
  safeZoneMm: 3,
  contentPaddingMm: 4,
  baseTargetWidthPx: 1347,
  baseTargetHeightPx: 981,
})
```

## 📝 Notes

- Les deux faces (recto/verso) sont exportables séparément
- Le système gère automatiquement les marges et le centrage
- Les polices sont chargées automatiquement avant l'export
