FROM node:22-alpine

WORKDIR /app

COPY package*.json ./

# Install only production dependencies
RUN npm ci --omit=dev

COPY app.js ./
COPY public ./public

# npm is only required while building the image.
# Remove npm, npx and npm cache from the final runtime image
# to reduce the image size and attack surface.
RUN rm -rf /usr/local/lib/node_modules/npm \
    /usr/local/bin/npm \
    /usr/local/bin/npx \
    /root/.npm

USER node

EXPOSE 3000

CMD ["node", "app.js"]
