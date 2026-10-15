# Production Nginx image serving React Admin build
FROM nginx:alpine

# Copy custom Nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy verified React production build artifacts
COPY build /usr/share/nginx/html

# Expose Admin web port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=15s --timeout=5s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://127.0.0.1:3000 || exit 1

CMD ["nginx", "-g", "daemon off;"]
