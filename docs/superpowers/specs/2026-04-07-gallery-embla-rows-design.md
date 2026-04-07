# Galerie en rangées — défilement continu (Embla)

**Date :** 2026-04-07  
**Statut :** spécification validée côté intention produit ; implémentation à planifier séparément.

## Contexte

La section galerie utilise aujourd’hui `GallerySection.astro` et `GalleryParallaxScroll.astro` : découpage en **colonnes**, **parallax lié au scroll** sur `md+`, grille mobile 2 colonnes avec bouton « Afficher plus », et **lightbox** plein écran avec navigation et miniatures.

## Objectifs

1. **Ne plus lier l’effet au scroll** de la page (suppression du parallax scroll-bound).
2. Remplacer le modèle **colonnes** par des **rangées** ; le contenu de chaque rangée est défini **manuellement** dans `GallerySection.astro` (équivalent des commentaires par colonne actuels, mais pour des lignes).
3. Chaque rangée affiche un **défilement horizontal infini**, **animé automatiquement** en continu.
4. **Quiconce des sens** : rangée 1 vers la droite, rangée 2 vers la gauche, rangée 3 vers la droite, etc. (alternance par index de rangée).
5. **Même principe sur mobile** que sur bureau : plusieurs rangées visibles avec défilement continu (pas de mode « galerie réduite » type « Afficher plus »).
6. L’utilisateur peut **interagir au swipe / drag** ; l’objectif produit est un ressenti **très fluide**, avec possibilité d’**accélérer** le défilement via le geste (détails d’implémentation : combinaison avec l’API Embla / Auto Scroll, par ex. variation temporaire de `speed`).
7. **Accessibilité** : si `prefers-reduced-motion: reduce`, **pas de défilement automatique** ; bandes **figées** avec **défilement horizontal manuel** (`overflow-x: auto` par rangée) pour conserver l’accès à toutes les images sans animation imposée.

## Décision technique : Embla Carousel

- **Bibliothèque :** [Embla Carousel](https://www.embla-carousel.com/docs/examples/predefined) (préférence pour la **branche stable documentée v8** pour les versions npm en production, sauf besoin explicite d’une capacité réservée à la v9).
- **Plugins :**
  - **`loop`** (option du carrousel, pas un package séparé) pour la boucle sans fin.
  - **`embla-carousel-auto-scroll`** — plugin **[Auto Scroll](https://www.embla-carousel.com/docs/plugins/auto-scroll)** : défilement **continu** (pixels par frame, direction `forward` | `backward`).
- **Exclu :** le plugin **[Autoplay](https://www.embla-carousel.com/docs/plugins/autoplay)**, qui avance **de snap en snap** sur un timer (comportement type diaporama), **non** équivalent à une bande continue.

### Pourquoi Auto Scroll plutôt qu’Autoplay

Autoplay cadence des **sauts entre positions** ; la spec demande un **mouvement horizontal continu** infini. Auto Scroll correspond à ce modèle ; la direction par rangée mappe directement l’alternance gauche/droite.

## Modèle de données

- `GallerySection.astro` expose une structure **par rangées**, par exemple un tableau de rangées contenant chacune la liste d’items `{ img, title, subtitle? }`.
- **Ordre global lightbox** : ordre d’indexation **stable** obtenu en **aplatissant** les rangées **de haut en bas**, et pour chaque rangée **dans l’ordre des slides** tel que rendu dans le DOM (gauche → droite dans le sens de lecture). Ce schéma doit être documenté dans le code pour que `data-index`, miniatures et prev/next restent prévisibles.

## Comportement UI

- **Conteneur par rangée :** pleine largeur, masque horizontal (`overflow: hidden`) en mode animé.
- **Slides :** une slide par image (largeurs variables possibles, alignées avec la doc Embla « variable widths » si nécessaire).
- **Suppression** du bouton **« Afficher plus »** et du masquage conditionnel d’images sur mobile : toutes les images sont présentes dans les bandes.
- **Lightbox :** conserver le comportement actuel (fermeture, focus trap, clavier, miniatures, préchargement) ; adapter uniquement les sélecteurs / la collecte des items si les classes ou la structure changent.
- Chaque item cliquable conserve `data-index`, `data-preview`, `data-highres`, `data-title`, `data-subtitle` (ou équivalent) pour alimenter la lightbox.

## Fichiers et renommage

- Remplacer ou refactorer `GalleryParallaxScroll.astro` en un composant dont le nom reflète le comportement (ex. galerie à rangées Embla), et mettre à jour l’import dans `GallerySection.astro`.
- Retirer : logique `splitIntoBalancedColumns`, classes et script **parallax / scroll**, styles associés au parallax.
- Ajouter les dépendances npm : `embla-carousel`, `embla-carousel-auto-scroll` (versions **alignées sur la doc v8 stable** choisie pour le projet).

## Performance

- Limiter les recompositions coûteuses ; s’appuyer sur le moteur Embla pour le scroll.
- Conserver des images dimensionnées de façon raisonnable (comme aujourd’hui) ; `will-change` ou équivalent seulement si mesurable et nécessaire.

## Tests et validation (pour la phase implémentation)

- Vérifier mobile et desktop : fluidité, pas de troncature visible au bouclage, scroll vertical de page non capturé par erreur.
- Vérifier `prefers-reduced-motion` : pas d’auto-scroll ; défilement manuel fonctionnel.
- Vérifier lightbox : ouverture sur la bonne image, navigation, accessibilité clavier.

## Hors périmètre (cette spec)

- Changements de contenu marketing hors galerie.
- Refonte visuelle globale (typo, couleurs) non nécessaires au nouveau mode de défilement.
