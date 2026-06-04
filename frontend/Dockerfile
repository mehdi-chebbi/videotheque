# ─── Stage 1: Build ────────────────────────────────────────────
FROM node:20-slim AS builder

WORKDIR /app

COPY package.json bun.lock ./
RUN npm install --frozen-lockfile

COPY vite.config.ts tsconfig.json index.html ./
COPY src ./src
COPY public ./public

RUN npm run build

# ─── Stage 2: Production (nginx) ─────────────────────────────
FROM nginx:alpine

COPY --from=builder /app/dist /usr/share/nginx/html

# Custom nginx config for SPA routing + API proxy
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
