# DameDéco — Spécification Backend (FastAPI)

Ce document décrit l’ensemble des **tables (BDD)** et des **API** nécessaires pour implémenter un backend FastAPI pour ce projet.

Le front est un e-commerce avec:
- Catalogue produits + catégories
- Panier local (Zustand) + checkout (Wave/COD + livraison/retrait)
- Avis produits
- Espace compte (profil + historique commandes)
- Espace admin (produits/commandes/clients/avis)
- Espace superadmin (gestion des utilisateurs)
- Auth JWT via **cookies httpOnly** (accessToken/refreshToken)

---

## 1) Modèle de données (Tables)

### 1.1 Auth & Utilisateurs

#### Table `users`
- `id` (UUID ou BIGINT)
- `email` (nullable, unique)
- `phone` (nullable, unique)
- `password_hash` (string)
- `name` (string)
- `role` (enum: `client`, `admin`, `superadmin`)
- `user_type` (enum: `retail`, `wholesale`)
- `avatar_url` (nullable)
- `is_active` (bool, default true)
- `created_at`, `updated_at`

Contraintes & indexes:
- unique(email) WHERE email IS NOT NULL
- unique(phone) WHERE phone IS NOT NULL

#### Table `refresh_tokens` (ou `sessions`)
Permet de gérer refresh token + révocation (aligné avec le code existant côté front).
- `id`
- `user_id` (FK -> users.id)
- `token_hash` (string)
- `expires_at` (datetime)
- `revoked_at` (nullable datetime)
- `created_at`
- (optionnel) `user_agent`, `ip`

---

### 1.2 Catalogue

#### Table `categories`
- `id` (slug/string ou UUID)
- `name`
- `icon` (string)
- `image_url`
- `position` (int, optionnel)
- `is_active` (bool)
- `created_at`, `updated_at`

#### Table `products`
- `id`
- `name`
- `category_id` (FK -> categories.id)
- `description`
- `price_retail` (DECIMAL/INT)
- `price_wholesale` (DECIMAL/INT)
- `original_price` (nullable)
- `stock` (int)
- `pieces` (nullable int)
- `is_popular` (bool)
- `cover_image_url`
- `created_at`, `updated_at`

#### Table `product_images`
- `id`
- `product_id` (FK -> products.id)
- `url`
- `position` (int)

---

### 1.3 Commandes

#### Table `orders`
- `id`
- `order_number` (string unique, optionnel)
- `user_id` (nullable FK -> users.id) *(permet commande invitée si souhaité)*
- `customer_name`
- `customer_email` (nullable)
- `customer_phone` (nullable)
- `status` (enum: `pending`, `processing`, `shipped`, `delivered`, `cancelled`)
- `source` (enum: `website`, `whatsapp`)
- `payment_method` (enum: `wave`, `cod`)
- `payment_status` (enum: `unpaid`, `paid`, `refunded`, `failed`)
- `currency` (ex: `XOF`)
- `subtotal_amount`
- `delivery_fee_amount`
- `total_amount`
- `delivery_method` (enum: `delivery`, `pickup`)
- `delivery_address` (nullable)
- `delivery_city` (nullable)
- `delivery_country` (nullable)
- `notes` (nullable)
- `created_at`, `updated_at`

#### Table `order_items`
- `id`
- `order_id` (FK -> orders.id)
- `product_id` (FK -> products.id)
- `product_name_snapshot` (string)
- `unit_price` (DECIMAL/INT)
- `price_type` (enum: `retail`, `wholesale`)
- `quantity` (int)
- `line_total` (DECIMAL/INT)

---

### 1.4 Avis produits

#### Table `product_reviews`
- `id`
- `product_id` (FK -> products.id)
- `user_id` (nullable FK -> users.id)
- `customer_name`
- `customer_email` (nullable)
- `rating` (int 1..5)
- `comment` (text)
- `verified_purchase` (bool default false)
- `helpful_count` (int default 0)
- `is_published` (bool default true)
- `created_at`, `updated_at`

Optionnel (si tu veux gérer correctement les “utile”):

#### Table `review_helpful_votes`
- `id`
- `review_id` (FK -> product_reviews.id)
- `user_id` (nullable) ou `voter_fingerprint` (string)
- contrainte unique (review_id, user_id) ou (review_id, voter_fingerprint)

---

### 1.5 Messages de contact

#### Table `contact_messages`
- `id`
- `name`
- `email`
- `subject`
- `message`
- `status` (enum: `new`, `in_progress`, `closed`)
- `created_at`

---

### 1.6 “Customers” (vue admin)

Le front possède un type `Customer` agrégé (`orders`, `totalSpent`).

Recommandation:
- **Pas de table `customers` dédiée**
- Utiliser `users` (role=client) + agrégats SQL sur `orders` (COUNT / SUM)

---

## 2) APIs FastAPI (spécification)

Convention:
- Base path: `/api/v1`
- Auth: cookies httpOnly (`accessToken`, `refreshToken`)
- Pagination: `page`, `limit`

### 2.1 Auth

- `POST /api/v1/auth/register`
  - body: `{ "email"?: string, "phone"?: string, "name": string, "password": string }`
  - resp: `{ "user": { id, email?, phone?, role, name } }`

- `POST /api/v1/auth/login`
  - body: `{ "identifier": string, "password": string }` *(identifier=email ou phone)*
  - set cookies: `accessToken`, `refreshToken`
  - resp: `{ "user": { id, email?, phone?, role, name } }`

- `POST /api/v1/auth/refresh`
  - cookies: `refreshToken`
  - resp: `{ "ok": true }` (+ nouveau `accessToken` cookie)

- `GET /api/v1/auth/me`
  - cookies: `accessToken`
  - resp: `{ "user": user | null }`

- `POST /api/v1/auth/logout`
  - clear cookies + revoke refresh token
  - resp: `{ "ok": true }`

---

### 2.2 Catalogue public

- `GET /api/v1/categories`

- `GET /api/v1/products`
  - query possible:
    - `q`
    - `category_id`
    - `popular` (bool)
    - `min_price`, `max_price`
    - `in_stock` (bool)
    - `page`, `limit`
    - `sort` (ex: `price_asc`, `price_desc`, `newest`)

- `GET /api/v1/products/{product_id}`

- `GET /api/v1/products/{product_id}/reviews`
  - query: `page`, `limit`, `published_only=true`

- `POST /api/v1/products/{product_id}/reviews`
  - body: `{ "customer_name": string, "customer_email"?: string, "rating": number, "comment": string }`

---

### 2.3 Checkout / Commandes

- `POST /api/v1/orders`
  - body (exemple):
    ```json
    {
      "customer": {"name": "", "email": "", "phone": ""},
      "items": [
        {"product_id": "", "quantity": 2, "price_type": "retail"}
      ],
      "delivery_method": "delivery",
      "delivery_address": "...",
      "payment_method": "wave",
      "notes": ""
    }
    ```
  - resp: `{ "order": ... }`

- `GET /api/v1/orders/{order_id}`
  - accès: propriétaire (client) OU admin/superadmin

- `GET /api/v1/account/orders`
  - accès: client

- `PATCH /api/v1/orders/{order_id}`
  - accès: admin/superadmin
  - body: `{ "status"?: ..., "payment_status"?: ..., "delivery_*"?: ... }`

---

### 2.4 Admin (CRUD catalogue)

- `POST /api/v1/admin/categories`
- `PATCH /api/v1/admin/categories/{id}`
- `DELETE /api/v1/admin/categories/{id}`

- `POST /api/v1/admin/products`
- `PATCH /api/v1/admin/products/{id}`
- `DELETE /api/v1/admin/products/{id}`

Images (optionnel):
- `POST /api/v1/admin/uploads` (multipart) -> `{ url }`
- `POST /api/v1/admin/products/{id}/images`

---

### 2.5 Admin (commandes / clients / reviews)

- `GET /api/v1/admin/orders`
  - query: `status`, `source`, `date_from`, `date_to`, `page`, `limit`

- `GET /api/v1/admin/customers`
  - renvoie liste de clients + stats (COUNT orders, SUM total)
  - query: `q`, `type`, `page`, `limit`

- `GET /api/v1/admin/reviews`
  - query: `product_id`, `published`, `page`, `limit`

- `PATCH /api/v1/admin/reviews/{id}`
  - body: `{ "is_published"?: bool, "verified_purchase"?: bool }`

- `DELETE /api/v1/admin/reviews/{id}` (optionnel)

---

### 2.6 Superadmin (users)

- `GET /api/v1/superadmin/users`

- `POST /api/v1/superadmin/users/admin`
  - body: `{ "name": string, "email": string, "password": string }`

Optionnel:
- `PATCH /api/v1/superadmin/users/{id}` (changer role, activer/désactiver)

---

### 2.7 Contact

- `POST /api/v1/contact`
  - body: `{ "name": string, "email": string, "subject": string, "message": string }`
  - resp: `{ "ok": true }`

Admin:
- `GET /api/v1/admin/contact-messages`
- `PATCH /api/v1/admin/contact-messages/{id}`

---

## 3) Notes d’intégration (important)

- Le front utilise déjà des cookies `accessToken`/`refreshToken`. En FastAPI:
  - activer CORS avec `allow_credentials=True`
  - configurer `SameSite`/`Secure` correctement en prod

- Incohérences actuelles dans le front:
  - `lib/api.ts` appelle `/api/categories` mais cette route n’existe pas côté Next.
  - Beaucoup d’écrans (admin/orders/customers/account orders) sont basés sur des mocks (`lib/data.ts`). Le backend est nécessaire pour les rendre “réels”.

- Devise:
  - le front affiche surtout `FCFA` mais certaines pages utilisent `€` (à normaliser côté front + backend).

---

## 4) Questions à valider (pour figer le schéma)

1) Commande invitée: autorisée ou compte obligatoire ?
2) Paiement: intégration réelle (Wave + webhooks) ou enregistrement simple ?
3) Stockage images: S3/Cloudinary/local ?
4) Commandes WhatsApp: enregistrer en DB via un endpoint dédié ou saisie manuelle admin ?
