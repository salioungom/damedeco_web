# Dockerfile - Build pour production (multi-stage)
FROM node:22-alpine AS deps

# Activer pnpm avec la version exacte détectée
RUN corepack enable && corepack prepare pnpm@11.1.2 --activate

WORKDIR /app

# Copier les fichiers de lock
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

# Installer les dépendances (frozen-lockfile garantit la reproductibilité)
RUN pnpm install --frozen-lockfile

# Stage builder : compilation de l'application
FROM node:22-alpine AS builder

# Activer pnpm
RUN corepack enable && corepack prepare pnpm@11.1.2 --activate

WORKDIR /app

# Copier les fichiers de lock et config
# pnpm-workspace.yaml est nécessaire pour allowBuilds (dépendances natives)
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

# Copier les dépendances depuis le stage deps
COPY --from=deps /app/node_modules ./node_modules

# Copier le code source
COPY . .

# Les NEXT_PUBLIC_* sont intégrées au bundle pendant le build Next.js.
ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_SITE_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_SITE_URL=$NEXT_PUBLIC_SITE_URL

# Garde-fous : les URLs nécessaires au build ne doivent pas être vides.
RUN test -n "$NEXT_PUBLIC_API_URL" || (echo "ERREUR : NEXT_PUBLIC_API_URL est vide" >&2 && exit 1)
RUN test -n "$NEXT_PUBLIC_SITE_URL" || (echo "ERREUR : NEXT_PUBLIC_SITE_URL est vide" >&2 && exit 1)

# Désactiver la télémétrie Next.js
ENV NEXT_TELEMETRY_DISABLED=1

# Builder l'application
RUN pnpm run build

# Stage runner : image finale légère
FROM node:22-alpine AS runner

# Installer curl pour le healthcheck
RUN apk add --no-cache curl

# Configuration de l'environnement de production
ENV NODE_ENV=production \
    PORT=3000 \
    HOSTNAME=0.0.0.0 \
    NEXT_TELEMETRY_DISABLED=1

# API_URL_SERVER optionnel pour le SSR/ISR en production (différent de NEXT_PUBLIC_API_URL si backend non accessible via l'URL publique)
ARG API_URL_SERVER
ENV API_URL_SERVER=${API_URL_SERVER}

WORKDIR /app

# Créer un utilisateur non-root pour la sécurité
RUN addgroup -S app && adduser -S app -G app

# Copier uniquement les artefacts nécessaires depuis le stage builder
COPY --from=builder --chown=app:app /app/public ./public
COPY --from=builder --chown=app:app /app/.next/standalone ./
COPY --from=builder --chown=app:app /app/.next/static ./.next/static

# Changer vers l'utilisateur non-root
USER app

# Exposer le port 3000
EXPOSE 3000

# Healthcheck : vérifie que l'application répond
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
    CMD curl -fsS http://localhost:3000/health || exit 1

# Démarrer avec le serveur standalone
CMD ["node", "server.js"]
