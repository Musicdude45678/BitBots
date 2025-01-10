# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Debug: Print a clear start marker
RUN echo "==================== BUILD STAGE START ===================="

# Define build arguments for environment variables
ARG VITE_FIREBASE_API_KEY
ARG VITE_FIREBASE_AUTH_DOMAIN
ARG VITE_FIREBASE_PROJECT_ID
ARG VITE_FIREBASE_STORAGE_BUCKET
ARG VITE_FIREBASE_MESSAGING_SENDER_ID
ARG VITE_FIREBASE_APP_ID
ARG VITE_OPENAI_API_KEY
ARG VITE_APP_ENV

# Debug: Print build arguments
RUN echo "==================== BUILD ARGS CHECK ====================" && \
    echo "VITE_FIREBASE_API_KEY length: ${#VITE_FIREBASE_API_KEY}" && \
    echo "VITE_FIREBASE_AUTH_DOMAIN length: ${#VITE_FIREBASE_AUTH_DOMAIN}" && \
    echo "VITE_FIREBASE_PROJECT_ID length: ${#VITE_FIREBASE_PROJECT_ID}" && \
    echo "VITE_FIREBASE_STORAGE_BUCKET length: ${#VITE_FIREBASE_STORAGE_BUCKET}" && \
    echo "VITE_FIREBASE_MESSAGING_SENDER_ID length: ${#VITE_FIREBASE_MESSAGING_SENDER_ID}" && \
    echo "VITE_FIREBASE_APP_ID length: ${#VITE_FIREBASE_APP_ID}" && \
    echo "VITE_OPENAI_API_KEY length: ${#VITE_OPENAI_API_KEY}"

# Set environment variables from build arguments
ENV VITE_FIREBASE_API_KEY=$VITE_FIREBASE_API_KEY
ENV VITE_FIREBASE_AUTH_DOMAIN=$VITE_FIREBASE_AUTH_DOMAIN
ENV VITE_FIREBASE_PROJECT_ID=$VITE_FIREBASE_PROJECT_ID
ENV VITE_FIREBASE_STORAGE_BUCKET=$VITE_FIREBASE_STORAGE_BUCKET
ENV VITE_FIREBASE_MESSAGING_SENDER_ID=$VITE_FIREBASE_MESSAGING_SENDER_ID
ENV VITE_FIREBASE_APP_ID=$VITE_FIREBASE_APP_ID
ENV VITE_OPENAI_API_KEY=$VITE_OPENAI_API_KEY
ENV VITE_APP_ENV=$VITE_APP_ENV

# Debug: Print environment check
RUN echo "==================== ENV CHECK ====================" && \
    env | grep VITE_

# Copy package files
COPY package*.json ./

# Prevent Husky install during npm ci
ENV HUSKY=0

# Install dependencies with verbose logging
RUN echo "==================== INSTALLING DEPENDENCIES ====================" && \
    npm ci --ignore-scripts --verbose

# Copy source code
COPY . .

# Debug: Check for key files
RUN echo "==================== FILE CHECK ====================" && \
    ls -la && \
    echo "Checking for .env file:" && \
    ls -la .env* || echo "No .env files found" && \
    echo "Checking vite.config.ts:" && \
    cat vite.config.ts

# Create a debug file to verify env vars at build time
RUN echo "==================== CREATE DEBUG FILE ====================" && \
    echo "window.BUILD_TIME_DEBUG = {" > /app/src/debug.js && \
    echo "  VITE_FIREBASE_API_KEY_LENGTH: '${#VITE_FIREBASE_API_KEY}'," >> /app/src/debug.js && \
    echo "  BUILD_TIME: '$(date)'," >> /app/src/debug.js && \
    echo "};" >> /app/src/debug.js && \
    cat /app/src/debug.js

# Build the application with detailed error output
RUN echo "==================== STARTING BUILD ====================" && \
    npm run build --verbose || (echo "==================== BUILD ERROR ====================" && \
    cat /root/.npm/_logs/*-debug.log && \
    exit 1)

# Debug: Check build output
RUN echo "==================== BUILD OUTPUT CHECK ====================" && \
    ls -la dist/

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
