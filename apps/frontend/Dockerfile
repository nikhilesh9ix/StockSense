# syntax=docker/dockerfile:1
#
# StockSense web UI: a static Vite build served by nginx, which also proxies
# /api to the backend. Build from the repository root:
#
#   docker build -f apps/frontend/Dockerfile -t stocksense-frontend .

FROM node:22-slim AS build
WORKDIR /app
COPY package.json package-lock.json ./
COPY apps/backend/package.json apps/backend/
COPY apps/frontend/package.json apps/frontend/
RUN npm ci --workspace=@stocksense/frontend --no-audit --no-fund
COPY apps/frontend apps/frontend
RUN npm run build --workspace=@stocksense/frontend

FROM nginx:stable-alpine
COPY apps/frontend/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/apps/frontend/dist /usr/share/nginx/html
EXPOSE 80
