# DameDéco E-Commerce

Site e-commerce moderne développé avec **Next.js**, **React 19** et **Material-UI** pour la vente de produits d'import depuis la Chine.

## 🚀 Installation & Démarrage

```bash
# Installation des dépendances
pnpm install

# Lancement du serveur de développement Next.js
pnpm dev

# Build de production
pnpm build

# Démarrage production
pnpm start
```

Le site sera accessible sur [http://localhost:3000](http://localhost:3000)

## 📁 Architecture du Projet

```
DameDéco/
├── src/
│   ├── components/        # Composants React
│   │   ├── ui/           # Composants UI personnalisés (52 composants)
│   │   ├── figma/        # Composants d'images avec fallback
│   │   ├── types/        # Type definitions
│   │   ├── HomePage.tsx
│   │   ├── ShopPage.tsx
│   │   ├── ProductDetailPage.tsx
│   │   ├── CategoryPage.tsx
│   │   ├── AdminDashboard.tsx
│   │   ├── Navigation.tsx
│   │   └── ...
│   ├── lib/
│   │   ├── auth/         # Authentification (JWT, bcrypt)
│   │   ├── db/           # Database layer
│   │   ├── data.ts       # Types et données de démo
│   │   ├── whatsapp.ts   # Configuration WhatsApp
│   │   ├── api.ts        # API client
│   │   └── types.ts      # Types globaux
│   ├── App.tsx           # Routage et état global
│   ├── main.tsx          # Point d'entrée React
│   ├── Providers.tsx     # Context providers
│   └── index.css         # Styles globaux CSS
├── public/               # Assets statiques
├── next.config.ts        # Configuration Next.js
└── package.json
```

## ✨ Fonctionnalités

- 🛍️ **Catalogue produits** avec navigation fluide
- 🗂️ **Gestion par catégories**
- 🛒 **Panier en temps réel** avec Zustand
- 💖 **Système de favoris** (localStorage)
- ⭐ **Avis clients** avec notation et vérification
- 💼 **Prix différenciés** (détail/gros)
- 📱 **Commande WhatsApp** en un clic
- 👤 **Interface administrateur** complète
- 🔐 **Authentification** JWT avec José
- 🌙 **Mode sombre/clair** avec next-themes
- 📱 **Design responsive** (Mobile-first)
- 📊 **Tableaux de données** avec MUI Data Grid
- 📅 **Date pickers** pour gestion

## 🎨 Technologies

### Core Framework
- **Next.js 16.0.1** - Framework React avec SSR/SSG
- **React 19.0.0** - Bibliothèque UI
- **TypeScript 5.9.3** - Typage statique

### UI & Styling
- **Material-UI (MUI) v7.3.5** - Système de design principal
  - MUI Icons Material
  - MUI X Data Grid (tableaux)
  - MUI X Date Pickers
- **Emotion 11.14** - CSS-in-JS (styling engine MUI)
- **Tailwind CSS v4** - Utilitaires CSS (usage limité)
- **clsx** - Utilitaire classes conditionnelles
- **tailwind-merge** - Merge classes utilitaires

### État & Données
- **Zustand 5.0.8** - Gestion d'état légère
- **Axios 1.13.2** - Client HTTP
- **localStorage** - Persistance locale (favoris, panier)

### Authentification & Sécurité
- **José 6.1.2** - Tokens JWT
- **Bcrypt 6.0.0** - Hashing mots de passe
- **cookies-next 6.1.1** - Gestion session cookies

### Composants & UX
- **embla-carousel-react 8.6** - Carrousels
- **react-resizable-panels 3.0.6** - Panels redimensionnables
- **cmdk 1.1.1** - Command palette
- **next-themes 0.4.6** - Thème sombre/clair

### Notifications
- **Sonner 2.0.7** - Toast notifications
- **Notistack 3.0.2** - Notifications empilables

### Graphiques
- **Recharts 2.15.4** - Graphiques et statistiques

## 🎨 Architecture de Styling

Le projet utilise une **architecture hybride** optimisée :

### Pages & Composants Business (100% MUI)
Tous les composants principaux utilisent exclusivement **Material-UI** avec la prop `sx` :
- `HomePage.tsx`, `ShopPage.tsx`, `ProductCard.tsx`
- `AdminDashboard.tsx`, `Navigation.tsx`
- `CheckoutPage.tsx`, `AboutPage.tsx`

**Style** : Emotion (CSS-in-JS via MUI)

### Composants UI Génériques (MUI + Tailwind)
Les composants utilitaires bas-niveau combinent MUI et Tailwind CSS :
- `chart.tsx`, `sidebar.tsx`, `form.tsx`
- `input-otp.tsx`, `collapsible.tsx`

**Tailwind CSS** : Utilisé uniquement pour des utilitaires simples (spacing, flexbox, grid)
**Raison** : Optimisation et rapidité pour composants génériques réutilisables

### Règle d'Architecture
```
┌─────────────────────────────┐
│   Business Components       │  → 100% MUI (sx prop)
│   (Pages, Features)         │
└─────────────────────────────┘
            ↓ utilise
┌─────────────────────────────┐
│   UI Generic Components     │  → MUI + Tailwind CSS
│   (Utilities, Primitives)   │
└─────────────────────────────┘
```

**Avantage** : Meilleure séparation des responsabilités et performances optimales


## 📖 Guide d'Utilisation

### Navigation Client

#### Page d'Accueil
- Affichage des catégories principales
- Produits populaires en vedette
- Navigation rapide vers boutique/catégories

#### Page Catégorie
- Filtres et tri (prix, popularité, nom)
- Affichage personnalisable (2/3/4 colonnes)
- Actions rapides : panier, favoris, WhatsApp

#### Page Produit
- **Galerie d'images** avec miniatures
- **Informations complètes** : prix, stock, description
- **Badges** : Populaire, réduction, stock limité
- **Actions** : 
  - Sélection de quantité
  - Ajout au panier
  - Favoris
  - Commander via WhatsApp
- **Produits similaires** en bas de page
- **Section avis** avec filtres

### Administration

#### Accès
Cliquer sur "Admin" dans le menu pour activer le mode administrateur.

#### Gestion des Catégories
1. **Ajouter** : Nom + Image (URL ou upload)
2. **Modifier** : Éditer nom/image
3. **Supprimer** : Avec confirmation

#### Gestion des Produits
1. **Ajouter un produit** :
   - Informations générales (nom, description, catégorie)
   - Prix (détail, promotion, grossiste)
   - Stock et nombre de pièces
   - Galerie d'images (minimum 1)

2. **Modifier** : Éditer toutes les propriétés

3. **Supprimer** : Retrait définitif

4. **Badges automatiques** :
   - Réduction (-X%) si prix avant promo renseigné
   - "Populaire" si marqué
   - "Stock limité" si < 20 unités

#### Tableau de Bord
- **Statistiques** : Ventes, revenus, produits, clients
- **Graphiques** : Évolution temporelle (Recharts)
- **Commandes récentes** avec source (Site/WhatsApp)
- **Gestion des avis clients**
- **Tableaux de données** avec MUI Data Grid

### Système d'Avis Clients

#### Pour les Clients
- **Consulter** : Notes et commentaires sur chaque produit
- **Filtrer** : Par nombre d'étoiles
- **Donner un avis** :
  - Note 1-5 étoiles
  - Nom (requis)
  - Email (optionnel)
  - Commentaire (min 10 caractères)

#### Pour l'Admin
- Statistiques globales (total avis, note moyenne)
- Liste complète avec actions (voir/supprimer)
- Badge "Achat vérifié" pour clients confirmés

#### Structure Technique
```typescript
interface Review {
  id: string;
  productId: string;
  customerName: string;
  customerEmail?: string;
  rating: number; // 1-5
  comment: string;
  date: string;
  verified?: boolean;
  helpful?: number;
}
```

### Intégration WhatsApp

#### Configuration
**Numéro** : +221 77 133 36 58 (DameDéco)

#### Fonctionnalités
- Bouton WhatsApp sur chaque produit
- Message pré-rempli automatique :
  - Nom du produit
  - Référence
  - Quantité
  - Prix total
  - Photo du produit

#### Tracking Admin
- Badge "WhatsApp" sur les commandes
- Statistiques de source (Site vs WhatsApp)
- Suivi complet de chaque commande

#### Modification du Numéro
Éditer `src/lib/whatsapp.ts` :
```typescript
export const WHATSAPP_CONFIG = {
  phoneNumber: '22177133658', // Format: code pays + numéro
  businessName: 'DameDéco',
};
```

## � Authentification

Le projet intègre un système d'authentification complet :

- **JWT Tokens** : Gestion sécurisée avec José
- **Bcrypt** : Hashing des mots de passe (6 rounds)
- **Cookies** : Session management avec cookies-next
- **Rôles** : Client (détail/gros), Administrateur

### Flow d'authentification
1. Connexion → Génération token JWT
2. Token stocké en cookie sécurisé
3. Validation token sur chaque requête protégée
4. Rôles et permissions gérés par le token

## 🌐 API Layer

- **Axios** : Client HTTP configuré pour les requêtes
- **API Routes** : Backend Next.js
- **Type Safety** : Types TypeScript complets
- **Error Handling** : Gestion d'erreurs centralisée

## �🗄️ Convention Backend (Option A)

Le projet utilise une convention **camelCase** 1:1 entre frontend et backend.

### Principes
- Noms de champs identiques en TypeScript et en base de données
- Utilisation de `db_column` dans Django pour forcer les noms camelCase
- API renvoie les mêmes clés que le frontend

### Exemples de Modèles Django

#### Category
```python
class Category(models.Model):
    id = models.CharField(primary_key=True, max_length=100, db_column='id')
    name = models.CharField(max_length=200, db_column='name')
    image = models.URLField(max_length=1000, db_column='image', blank=True)
    
    class Meta:
        db_table = 'category'
```

#### Product
```python
class Product(models.Model):
    id = models.CharField(primary_key=True, max_length=100, db_column='id')
    name = models.CharField(max_length=300, db_column='name')
    category = models.ForeignKey(Category, on_delete=models.PROTECT, 
                                 db_column='category', related_name='products')
    price = models.DecimalField(max_digits=12, decimal_places=2, db_column='price')
    originalPrice = models.DecimalField(max_digits=12, decimal_places=2, 
                                        null=True, blank=True, db_column='originalPrice')
    wholesalePrice = models.DecimalField(max_digits=12, decimal_places=2, 
                                          db_column='wholesalePrice')
    description = models.TextField(db_column='description', blank=True)
    image = models.URLField(max_length=1000, db_column='image', blank=True)
    stock = models.IntegerField(db_column='stock', default=0)
    pieces = models.IntegerField(db_column='pieces', null=True, blank=True)
    popular = models.BooleanField(db_column='popular', default=False)
    averageRating = models.FloatField(db_column='averageRating', null=True, blank=True)
    reviewCount = models.IntegerField(db_column='reviewCount', default=0)
    
    class Meta:
        db_table = 'product'
```

### Mapping Complet

| Frontend | Base de données |
|----------|----------------|
| id | id |
| name | name |
| category | category (FK) |
| price | price |
| originalPrice | originalPrice |
| wholesalePrice | wholesalePrice |
| averageRating | averageRating |
| reviewCount | reviewCount |
| productId | productId (FK) |
| customerName | customerName |
| customerEmail | customerEmail |

## 🎯 Bonnes Pratiques

### Gestion des Avis
1. Modérer régulièrement via dashboard admin
2. Répondre aux avis négatifs professionnellement
3. Marquer les avis vérifiés pour crédibilité
4. Encourager les clients à laisser un avis post-achat

### WhatsApp Business
1. Répondre dans les 2h maximum
2. Confirmer disponibilité immédiatement
3. Mettre à jour le statut dans le dashboard
4. Archiver toutes les commandes dans le système

### Administration Quotidienne
1. Mettre à jour les stocks
2. Ajouter nouveaux produits avec images de qualité
3. Gérer les promotions
4. Vérifier les nouvelles commandes

## 📱 Design Responsive

| Écran | Colonnes | Largeur |
|-------|----------|---------|
| Mobile | 1 | < 768px |
| Tablet | 2 | 768-1023px |
| Laptop | 3 | 1024-1279px |
| Desktop | 4 | > 1280px |

## 🔧 Scripts Disponibles

```bash
# Développement
pnpm dev             # Lance Next.js dev server sur port 3000

# Production
pnpm build           # Build optimisé pour production
pnpm start           # Lance le serveur production

# Qualité de code
pnpm lint            # ESLint avec --max-warnings=0
```

## 📄 Crédits

- **Composants UI** : Composants personnalisés basés sur Material-UI v7
- **Photos** : [Unsplash](https://unsplash.com) (Unsplash License)
- **Icônes** : Material Icons (Apache License 2.0)

## 📞 Support

Pour toute question :
- **WhatsApp Business** : +221 77 133 36 58
- **Contact** : DameDéco
---

**Version** : 2.0  
**Date** : Décembre 2024  
**Framework** : Next.js 16 + React 19 + Material-UI v7  
**Développé avec** : ❤️ pour DameDéco E-Commerce