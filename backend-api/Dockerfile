# Build Stage
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Build TypeScript code
RUN npm run build

# Expose API Port
EXPOSE 4000

# Start command
CMD ["node", "dist/index.js"]
