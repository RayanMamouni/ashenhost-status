FROM node:20-alpine AS base
WORKDIR /app
RUN apk add --no-cache openssl libc6-compat
RUN npm install -g pnpm || true

FROM base AS builder
WORKDIR /app
COPY package.json ./
COPY packages/ ./packages/
COPY apps/web/ ./apps/web/
COPY apps/worker/package.json ./apps/worker/package.json

RUN npm install
RUN npm run db:generate
RUN cd apps/web && npm run build

FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production

COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages ./packages
COPY --from=builder /app/apps/web/package.json ./apps/web/package.json
COPY --from=builder /app/apps/web/.next ./apps/web/.next
COPY --from=builder /app/apps/web/next.config.js ./apps/web/next.config.js
RUN mkdir -p ./apps/web/public
COPY --from=builder /app/apps/web/public ./apps/web/public

EXPOSE 3000
CMD ["npm", "run", "start", "--workspace=apps/web"]
