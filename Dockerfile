FROM node:24-alpine AS build
WORKDIR /workspace
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund
COPY index.html vite.config.js ./
COPY config ./config
COPY scripts ./scripts
COPY src ./src
RUN npm run build

FROM nginx:1.28-alpine AS runtime
ENV BACKEND_UPSTREAM=backend:8000 \
    NGINX_ENVSUBST_FILTER="^BACKEND_UPSTREAM$"
COPY nginx.conf /etc/nginx/templates/default.conf.template
COPY --from=build /workspace/dist /usr/share/nginx/html/knowledge-accumulation/registry
EXPOSE 80
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
    CMD wget -q -O /dev/null http://127.0.0.1/healthz || exit 1
CMD ["nginx", "-g", "daemon off;"]
