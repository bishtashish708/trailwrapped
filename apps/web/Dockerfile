FROM node:20-alpine AS builder

WORKDIR /app

# npm workspaces: the lockfile and every workspace's package.json are needed
# for `npm ci` to resolve correctly, even to build just this one app.
COPY package*.json ./
COPY apps/web/package.json ./apps/web/package.json
COPY apps/server/package.json ./apps/server/package.json
RUN npm ci

COPY apps/web ./apps/web
RUN npm run build --workspace=apps/web

FROM node:20-alpine
WORKDIR /app
COPY --from=builder /app/apps/web/.next/standalone ./
COPY --from=builder /app/apps/web/.next/static ./apps/web/.next/static
COPY --from=builder /app/apps/web/public ./apps/web/public

EXPOSE 3000
CMD ["node", "apps/web/server.js"]
