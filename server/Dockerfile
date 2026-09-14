FROM node:22-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --production --no-optional --no-audit --no-fund
COPY . .
EXPOSE 3000
CMD ["node", "server.js"]
