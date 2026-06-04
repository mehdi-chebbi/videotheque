# ─── Stage 1: Build ────────────────────────────────────────────
FROM node:20-slim AS builder

WORKDIR /app

COPY package.json bun.lock ./
RUN npm install --frozen-lockfile

COPY tsconfig.json ./
COPY src ./src
RUN npm run build

# ─── Stage 2: Production ──────────────────────────────────────
FROM node:20-slim

RUN apt-get update && apt-get install -y --no-install-recommends \
    ffmpeg \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package.json bun.lock ./
RUN npm install --omit=dev --frozen-lockfile

COPY --from=builder /app/dist ./dist

# Create storage directory
RUN mkdir -p /app/storage

ENV NODE_ENV=production
ENV PORT=4000
ENV STORAGE_PATH=/app/storage

EXPOSE 4000

CMD ["node", "dist/index.js"]
