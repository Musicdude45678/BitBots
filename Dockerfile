# Secrets stage
FROM alpine:latest as secrets
RUN --mount=type=secret,id=env,target=/run/secrets/.env \
    if [ -f /run/secrets/.env ]; then \
    mkdir -p /secrets && \
    grep -E "^VITE_" /run/secrets/.env > /secrets/env; \
    fi

# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Prevent Husky install during npm ci
ENV HUSKY=0

# Install dependencies
RUN npm ci --ignore-scripts

# Copy source code
COPY . .

# Copy secrets from secrets stage
COPY --from=secrets /secrets/env .env

# Build the application
RUN npm run build

# Production stage
FROM nginx:alpine-slim

# Copy built assets from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Add nginx configuration to handle SPA routing
RUN echo 'server { \
    listen 80; \
    location / { \
        root /usr/share/nginx/html; \
        index index.html; \
        try_files $uri $uri/ /index.html; \
    } \
}' > /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
