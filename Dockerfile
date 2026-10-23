# syntax=docker/dockerfile:1

FROM node:24-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund
COPY . .
ARG BUILD_SHA=dev
ARG BUILD_DATE=""
ENV PUBLIC_BUILD_SHA=${BUILD_SHA} PUBLIC_BUILD_DATE=${BUILD_DATE} ASTRO_TELEMETRY_DISABLED=1
RUN npm run build && node scripts/csp.mjs dist /app/csp.conf

FROM nginxinc/nginx-unprivileged:1.30-alpine
# Pull Alpine security fixes that landed after the base image was published.
# BUILD_DATE in the command busts the CI layer cache at least once a day, so
# this never gets stuck on a cached, stale result.
ARG BUILD_DATE=""
USER root
RUN echo "os patches as of ${BUILD_DATE:-unknown}" && apk upgrade --no-cache
USER 101
COPY deploy/nginx.conf /etc/nginx/conf.d/default.conf
COPY deploy/security-headers.conf /etc/nginx/snippets/security-headers.conf
COPY --from=build /app/csp.conf /etc/nginx/snippets/csp.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=3s CMD wget -qO /dev/null http://127.0.0.1:8080/healthz || exit 1
