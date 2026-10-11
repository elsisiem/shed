FROM node:22-slim
WORKDIR /app
ENV NODE_ENV=production
COPY package.json package-lock.json* ./
RUN npm install --omit=dev
COPY src ./src
COPY public ./public
EXPOSE 8080
CMD ["node_modules/.bin/tsx", "src/server.ts"]
