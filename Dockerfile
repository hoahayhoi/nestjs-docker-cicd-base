# Stage 1: Builder
ARG NODE_VERSION=22
FROM node:${NODE_VERSION} AS builder

WORKDIR /app
ARG NODE_ENV=production
ENV NODE_ENV=${NODE_ENV}

COPY package*.json ./
COPY prisma ./prisma/
RUN npm ci --silent

COPY . .
RUN npm run build

# Stage 2: Runtime
FROM node:22-slim AS runner

WORKDIR /app
ENV NODE_ENV=production

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma

EXPOSE ${APP_PORT:-80}
CMD ["npm", "run", "start:prod"]
