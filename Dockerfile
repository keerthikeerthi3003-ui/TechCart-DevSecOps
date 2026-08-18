FROM node:22-alpine

WORKDIR /app

# Update npm to the latest version to remediate
# vulnerabilities in npm's bundled dependencies
RUN npm install -g npm@latest

COPY package*.json ./

RUN npm ci --omit=dev

COPY app.js ./
COPY public ./public

USER node

EXPOSE 3000

CMD ["node", "app.js"]
