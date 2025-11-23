FROM node:18-slim
WORKDIR /usr/src/app

# Install only production dependencies
COPY package*.json ./
RUN npm install --production --silent

# Copy server code
COPY server/ ./server/

ENV PORT=8080
EXPOSE 8080

CMD ["node", "server/index.js"]
