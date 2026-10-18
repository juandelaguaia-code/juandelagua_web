# ---- build ----
FROM node:24-alpine AS build
WORKDIR /app
COPY package.json package-lock.json .npmrc ./
RUN npm ci
COPY . .
RUN npm run build && npm prune --omit=dev

# ---- runtime ----
FROM node:24-alpine
WORKDIR /app
ENV NODE_ENV=production HOST=0.0.0.0 PORT=4321
COPY --from=build /app/package.json ./
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY deploy/indexnow.mjs ./deploy/indexnow.mjs
USER node
EXPOSE 4321
HEALTHCHECK --interval=30s --timeout=3s CMD wget -qO- http://127.0.0.1:4321/ >/dev/null || exit 1
# IndexNow corre en segundo plano: avisa a Bing cuando esta versión ya está en línea (ver deploy/indexnow.mjs)
CMD ["sh", "-c", "node ./deploy/indexnow.mjs & exec node ./dist/server/entry.mjs"]
