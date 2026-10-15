FROM node:18-alpine

WORKDIR /app

# Copy application files and verified dependencies directly
COPY . .

# Expose backend API port
EXPOSE 5000

# Health check using busybox wget included in alpine
HEALTHCHECK --interval=15s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://127.0.0.1:5000/health || exit 1

CMD ["node", "server/server.js"]
