# syntax=docker/dockerfile:1
FROM node:20-alpine

WORKDIR /app

# Install deps first for better layer caching
COPY package*.json ./
RUN npm ci --only=production

# Copy app
COPY . .

ENV NODE_ENV=production
ENV PORT=3000
EXPOSE 3000

# Optional: basic healthcheck (works in Docker; K8s uses probes)
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD wget -qO- http://127.0.0.1:${PORT}/healthz || exit 1

CMD ["node", "server.js"]