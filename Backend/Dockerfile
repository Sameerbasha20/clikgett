FROM node:22-alpine

WORKDIR /app

# Install production dependencies inside the image (node_modules is not in git, and
# the host's copy is excluded by .dockerignore). Lockfile first for layer caching.
COPY package.json package-lock.json ./
RUN npm ci --omit=dev --legacy-peer-deps && npm cache clean --force

COPY . .

# Render sets PORT; locally docker-compose maps 5000.
EXPOSE 5000

# Health check using busybox wget included in alpine
HEALTHCHECK --interval=15s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider "http://127.0.0.1:${PORT:-5000}/health" || exit 1

CMD ["node", "server/server.js"]
