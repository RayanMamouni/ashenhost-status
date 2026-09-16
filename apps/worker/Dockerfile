FROM node:20-alpine AS base
WORKDIR /app
RUN apk add --no-cache openssl libc6-compat

FROM base AS builder
WORKDIR /app
COPY package.json ./
COPY packages/ ./packages/
COPY apps/worker/ ./apps/worker/
COPY apps/web/package.json ./apps/web/package.json

RUN npm install
RUN npm run db:generate
RUN npm run build --workspace=@ashenhost/shared-types
RUN npm run build --workspace=@ashenhost/worker

FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production

COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages ./packages
COPY --from=builder /app/apps/worker ./apps/worker

CMD ["npm", "run", "start", "--workspace=apps/worker"]
