FROM node:24-alpine AS builder

WORKDIR /app

COPY package*.json ./

COPY prisma ./prisma/

RUN npm install

RUN npx prisma generate

COPY . .

FROM node:24-alpine AS production

ENV NODE_ENV=production

WORKDIR /app

COPY package*.json ./

RUN npm install --omit=dev

COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma

COPY --from=builder /app/src ./src
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/prisma.config.ts ./

RUN chown -R node:node /app

USER node

EXPOSE 3000

CMD ["node", "src/app.js"]