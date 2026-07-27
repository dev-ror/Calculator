FROM node:20-alpine
RUN apk add --no-cache openssl

EXPOSE 3000

WORKDIR /app

ENV NODE_ENV=production

COPY package.json package-lock.json* ./
COPY apps/shopify-app/package.json ./apps/shopify-app/package.json
COPY packages/database/package.json ./packages/database/package.json

RUN npm ci --omit=dev && npm cache clean --force

COPY . .

RUN npm run build --workspace=@calculator/shopify-app

CMD ["npm", "run", "docker-start", "--workspace=@calculator/shopify-app"]
