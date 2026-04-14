FROM node:20-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY tsconfig.json ./
COPY scripts ./scripts
COPY src ./src

RUN npm run build

FROM node:20-alpine AS runner

WORKDIR /app
ENV NODE_ENV=production

COPY package.json package-lock.json ./
RUN npm ci --omit=dev

COPY --from=builder /app/build ./build
COPY scripts ./scripts
COPY database ./database

RUN addgroup -S app && adduser -S app -G app
RUN chown -R app:app /app

USER app

CMD ["sh", "-c", "node scripts/migrate.mjs && node build/index.js"]
