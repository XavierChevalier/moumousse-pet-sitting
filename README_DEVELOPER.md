# 👨‍💻 Guide du développeur - Moumousse Pet Sitting

Ce document est destiné aux développeurs travaillant sur le projet Moumousse Pet Sitting.

## 📋 Table des matières

- [Architecture](#architecture)
- [Stack technique](#stack-technique)
- [Structure du projet](#structure-du-projet)
- [Configuration](#configuration)
- [Développement](#développement)
- [Composants principaux](#composants-principaux)
- [Système de printables](#système-de-printables)
- [Bonnes pratiques](#bonnes-pratiques)
- [Scripts disponibles](#scripts-disponibles)

## 🏗️ Architecture

Le projet utilise **Astro** comme framework principal, permettant de générer un site statique optimisé.

### Principes

- **Static Site Generation (SSG)** : Toutes les pages sont pré-rendues au build
- **Islands Architecture** : JavaScript uniquement où nécessaire (composants interactifs)
- **TypeScript strict** : Typage strict activé pour une meilleure sécurité de type
- **Tailwind CSS 4** : Utilisation de Tailwind pour le styling

## 🛠️ Stack technique

- **Astro** 5.16.11 - Framework principal
- **TypeScript** - Typage statique
- **Tailwind CSS 4** - Framework CSS utility-first
- **Sharp** - Optimisation d'images (AVIF, WebP)
- **html-to-image** - Export de printables (chargé dynamiquement)

## 📁 Structure du projet

```
moumousse-pet-sitting/
├── public/                 # Assets statiques (images, fonts, printables)
├── src/
│   ├── components/        # Composants Astro réutilisables
│   │   ├── ui/            # Composants UI de base (Button, Input, etc.)
│   │   ├── contacts/      # Composants de contact
│   │   ├── galleries/     # Composants de galerie
│   │   ├── navigations/   # Composants de navigation
│   │   └── printables/   # Système de printables (voir README dédié)
│   ├── config/            # Configuration centralisée
│   │   └── SiteConfig.ts  # Configuration du site (contact, SEO, etc.)
│   ├── core/              # Utilitaires et logique métier
│   │   ├── tailwindcn.ts  # Utilitaires Tailwind
│   │   └── printables/    # Core du système de printables
│   ├── layouts/           # Layouts Astro
│   ├── pages/             # Pages du site (routing automatique)
│   └── styles/            # Styles globaux
├── build/                 # Scripts de build
└── astro.config.mjs       # Configuration Astro
```

## ⚙️ Configuration

### Configuration du site

Toute la configuration du site est centralisée dans `src/config/SiteConfig.ts` :

```typescript
export const siteConfig = {
  contact: {
    email: '...',
    encodedPhone: '...',  // Encoded phone (anti-spam)
  },
  seo: { ... },
  calendly: { ... },
}
```

### Variables d'environnement

Le projet n'utilise actuellement pas de variables d'environnement. Les URLs (ex: Umami Analytics) sont hardcodées.

**Recommandation future** : Externaliser les URLs dans des variables d'environnement.

## 🚀 Développement

### Prérequis

- Node.js (version recommandée dans `.nvmrc` si présent)
- pnpm

### Installation

```bash
pnpm install
```

### Développement local

```bash
pnpm dev
```

Le site sera accessible sur `http://localhost:4321`

### Build de production

```bash
pnpm build
```

Les fichiers générés seront dans `dist/`.

### Prévisualisation du build

```bash
pnpm preview
```

## 🧩 Composants principaux

### Composants UI

Les composants UI de base sont dans `src/components/ui/` :

- `Button.astro` - Bouton avec variants (filled, outlined, etc.)
- `Input.astro` - Champ de saisie
- `Alert.astro` - Messages d'alerte
- `ProtectedContent.astro` - Contenu protégé (téléphone, texte encodé)

### Composants métier

- `ContactForm.astro` - Formulaire de contact Netlify
- `GalleryEmblaRows.astro` - Galerie en rangées (Embla, défilement horizontal)
- `Navigation.astro` - Navigation principale
- `SEO.astro` - Gestion du SEO (meta tags, structured data)

### Protection du contenu

Le système de protection du contenu (`ProtectedContent.astro`) utilise un algorithme d'encodage simple pour protéger les informations sensibles (téléphone) :

```typescript
/**
 * Décode un contenu protégé
 * Algorithme : shift -3, reverse, base64 decode
 */
function decode(encoded: string): string
```

**Note de sécurité** : Cet algorithme est visible dans le code source et n'est qu'une protection basique contre le scraping automatique. Pour une vraie sécurité, utiliser un service backend.

## 📄 Système de printables

Le système de printables permet de générer des documents imprimables (cartes de visite, flyers) avec dimensions précises.

**Documentation complète** : Voir [`src/components/printables/README.md`](./src/components/printables/README.md)

### Points clés

- Pages printables **uniquement en mode développement** (`import.meta.env.DEV`)
- Exclusion automatique du build de production
- Export PNG haute résolution (600 DPI)
- Gestion automatique des repères de coupe, bleed, zones de sécurité

## ✅ Bonnes pratiques

### TypeScript

- ✅ Utiliser des types stricts (éviter `any`)
- ✅ Vérifier les valeurs null avant assertion de type
- ✅ Documenter les fonctions complexes avec JSDoc

### Astro

- ✅ Utiliser les composants Astro pour le HTML statique
- ✅ Utiliser les `<script>` pour l'interactivité côté client
- ✅ Préférer les slots pour la composition de composants

### CSS

- ✅ Utiliser Tailwind CSS pour le styling
- ✅ Éviter les styles inline sauf cas spécifiques
- ✅ Utiliser les variables CSS pour les valeurs réutilisables

### Accessibilité

- ✅ Ajouter des attributs ARIA appropriés
- ✅ Gérer le focus clavier
- ✅ Utiliser des labels sémantiques

### Performance

- ✅ Lazy loading des images
- ✅ Optimisation des images avec Sharp
- ✅ Minimiser le JavaScript côté client

## 📜 Scripts disponibles

```bash
pnpm dev         # Développement local
pnpm build       # Build de production
pnpm preview     # Prévisualisation du build
```

**Scripts manquants recommandés** :

- `pnpm lint` - Linter le code
- `pnpm type-check` - Vérifier les types TypeScript
- `pnpm format` - Formater le code avec Prettier

## 🔍 Fonctions complexes documentées

Les fonctions complexes du projet sont documentées avec JSDoc :

- `decode()` - Décodage de contenu protégé (`ProtectedContent.astro`)
- `decodeProtectedContent()` - Affichage de contenu protégé (`ProtectedContent.astro`)
- `createPrintableDimensions()` - Calcul des dimensions de printables (`dimensions.ts`)
- `setupPrintableExport()` - Initialisation du système d'export (`export-controller.ts`)
- `validateForm()` - Validation du formulaire de contact (`ContactForm.astro`)
- `submitForm()` - Soumission du formulaire (`ContactForm.astro`)

## 🐛 Débogage

### Console errors

Les erreurs sont actuellement loggées dans la console. Pour un meilleur suivi en production, considérer l'intégration d'un service de monitoring (Sentry, LogRocket).

### Mode développement

Les pages printables sont uniquement accessibles en mode développement. Vérifier `import.meta.env.DEV` si une page ne s'affiche pas.

## 📚 Ressources

- [Documentation Astro](https://docs.astro.build)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [TypeScript](https://www.typescriptlang.org/docs)

## 🤝 Contribution

Pour contribuer au projet :

1. Créer une branche depuis `master`
2. Faire les modifications
3. Tester localement
4. Créer une pull request

**Note** : Un fichier `CONTRIBUTING.md` serait recommandé pour des guidelines plus détaillées.

---

**Dernière mise à jour** : 26 janvier 2026
