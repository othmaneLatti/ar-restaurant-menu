FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy source code and prisma schema
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Build the TypeScript code
RUN npm run build

# Expose port
EXPOSE 3000

# Start command
# We use a shell script or command chain to migrate the DB before starting the server
CMD ["sh", "-c", "npx prisma migrate deploy && npm start"]
