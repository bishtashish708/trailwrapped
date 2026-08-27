FROM node:20-alpine

WORKDIR /app

# npm workspaces: the lockfile and every workspace's package.json are needed
# for `npm ci` to resolve correctly, even to build just this one app.
COPY package*.json ./
COPY apps/server/package.json ./apps/server/package.json
COPY apps/web/package.json ./apps/web/package.json
RUN npm ci

COPY apps/server ./apps/server
RUN npm run build --workspace=apps/server

WORKDIR /app/apps/server
EXPOSE 3001
CMD ["node", "dist/index.js"]
