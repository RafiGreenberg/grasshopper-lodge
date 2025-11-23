FROM node:18-slim
WORKDIR /usr/src/app

# Copy package manifest and install production dependencies
# Expectation: build context is `server/` (faster). If you build from repo root,
# pass `--dockerfile=server/Dockerfile` and a context of `server/`.
COPY package*.json ./
RUN npm install --production --silent

# Copy application files
COPY . ./

ENV PORT=8080
EXPOSE 8080

CMD ["node", "index.js"]
