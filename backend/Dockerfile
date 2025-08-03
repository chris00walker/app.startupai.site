FROM node:22-alpine AS builder
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build || true

FROM node:22-alpine
WORKDIR /app
COPY --from=builder /app .
EXPOSE 4000
CMD ["node", "server/index.js"]
