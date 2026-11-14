# syntax=docker/dockerfile:1

# ---------------------------------------------------------------------------
# Standalone build: compiles the React app inside the image.
# Use it when you do not have Node on the machine building the image:
#   docker build --target full -t astro-chat .
# ---------------------------------------------------------------------------
FROM node:20-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:1.27-alpine AS full
LABEL org.opencontainers.image.title="astro-chat"
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/build /usr/share/nginx/html
EXPOSE 80
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s \
  CMD wget -qO- http://127.0.0.1/ >/dev/null 2>&1 || exit 1

# ---------------------------------------------------------------------------
# Default target: serves pre-built assets from ./build.
# CI builds them on the runner (fast) and only this stage is built for arm64,
# so no npm build has to run under QEMU:
#   npm run build && docker build -t astro-chat .
# ---------------------------------------------------------------------------
FROM nginx:1.27-alpine AS runtime
LABEL org.opencontainers.image.title="astro-chat"
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY build/ /usr/share/nginx/html/
EXPOSE 80
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s \
  CMD wget -qO- http://127.0.0.1/ >/dev/null 2>&1 || exit 1
