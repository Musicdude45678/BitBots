# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Define build arguments for environment variables
ARG VITE_FIREBASE_API_KEY
ARG VITE_FIREBASE_AUTH_DOMAIN
ARG VITE_FIREBASE_PROJECT_ID
ARG VITE_FIREBASE_STORAGE_BUCKET
ARG VITE_FIREBASE_MESSAGING_SENDER_ID
ARG VITE_FIREBASE_APP_ID
ARG VITE_OPENAI_API_KEY
ARG VITE_APP_ENV

# Debug: Print build arguments (masking sensitive values)
RUN echo "=== Build Arguments ===" && \
    echo "VITE_FIREBASE_API_KEY exists: $(if [ ! -z "$VITE_FIREBASE_API_KEY" ]; then echo "yes"; else echo "no"; fi)" && \
    echo "VITE_FIREBASE_AUTH_DOMAIN exists: $(if [ ! -z "$VITE_FIREBASE_AUTH_DOMAIN" ]; then echo "yes"; else echo "no"; fi)" && \
    echo "VITE_FIREBASE_PROJECT_ID exists: $(if [ ! -z "$VITE_FIREBASE_PROJECT_ID" ]; then echo "yes"; else echo "no"; fi)" && \
    echo "VITE_FIREBASE_STORAGE_BUCKET exists: $(if [ ! -z "$VITE_FIREBASE_STORAGE_BUCKET" ]; then echo "yes"; else echo "no"; fi)" && \
    echo "VITE_FIREBASE_MESSAGING_SENDER_ID exists: $(if [ ! -z "$VITE_FIREBASE_MESSAGING_SENDER_ID" ]; then echo "yes"; else echo "no"; fi)" && \
    echo "VITE_FIREBASE_APP_ID exists: $(if [ ! -z "$VITE_FIREBASE_APP_ID" ]; then echo "yes"; else echo "no"; fi)" && \
    echo "VITE_OPENAI_API_KEY exists: $(if [ ! -z "$VITE_OPENAI_API_KEY" ]; then echo "yes"; else echo "no"; fi)" && \
    echo "VITE_APP_ENV exists: $(if [ ! -z "$VITE_APP_ENV" ]; then echo "yes"; else echo "no"; fi)"

# Set environment variables from build arguments
ENV VITE_FIREBASE_API_KEY=$VITE_FIREBASE_API_KEY
ENV VITE_FIREBASE_AUTH_DOMAIN=$VITE_FIREBASE_AUTH_DOMAIN
ENV VITE_FIREBASE_PROJECT_ID=$VITE_FIREBASE_PROJECT_ID
ENV VITE_FIREBASE_STORAGE_BUCKET=$VITE_FIREBASE_STORAGE_BUCKET
ENV VITE_FIREBASE_MESSAGING_SENDER_ID=$VITE_FIREBASE_MESSAGING_SENDER_ID
ENV VITE_FIREBASE_APP_ID=$VITE_FIREBASE_APP_ID
ENV VITE_OPENAI_API_KEY=$VITE_OPENAI_API_KEY
ENV VITE_APP_ENV=$VITE_APP_ENV

# Debug: Print environment variables after setting them (masking sensitive values)
RUN echo "=== Environment Variables ===" && \
    echo "VITE_FIREBASE_API_KEY exists: $(if [ ! -z "$VITE_FIREBASE_API_KEY" ]; then echo "yes"; else echo "no"; fi)" && \
    echo "VITE_FIREBASE_AUTH_DOMAIN exists: $(if [ ! -z "$VITE_FIREBASE_AUTH_DOMAIN" ]; then echo "yes"; else echo "no"; fi)" && \
    echo "VITE_FIREBASE_PROJECT_ID exists: $(if [ ! -z "$VITE_FIREBASE_PROJECT_ID" ]; then echo "yes"; else echo "no"; fi)" && \
    echo "VITE_FIREBASE_STORAGE_BUCKET exists: $(if [ ! -z "$VITE_FIREBASE_STORAGE_BUCKET" ]; then echo "yes"; else echo "no"; fi)" && \
    echo "VITE_FIREBASE_MESSAGING_SENDER_ID exists: $(if [ ! -z "$VITE_FIREBASE_MESSAGING_SENDER_ID" ]; then echo "yes"; else echo "no"; fi)" && \
    echo "VITE_FIREBASE_APP_ID exists: $(if [ ! -z "$VITE_FIREBASE_APP_ID" ]; then echo "yes"; else echo "no"; fi)" && \
    echo "VITE_OPENAI_API_KEY exists: $(if [ ! -z "$VITE_OPENAI_API_KEY" ]; then echo "yes"; else echo "no"; fi)" && \
    echo "VITE_APP_ENV exists: $(if [ ! -z "$VITE_APP_ENV" ]; then echo "yes"; else echo "no"; fi)"

# Copy package files
COPY package*.json ./

# Prevent Husky install during npm ci
ENV HUSKY=0

# Install dependencies
RUN npm ci --ignore-scripts

# Copy source code
COPY . .

# Debug: Print contents of .env file if it exists
RUN if [ -f .env ]; then echo "=== .env file exists ==="; else echo "=== .env file does not exist ==="; fi

# Debug: Print environment before build
RUN echo "=== Pre-build Environment ===" && \
    node -e "console.log('Build-time environment:', process.env)"

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
