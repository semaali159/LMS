# Use official Node image
FROM node:20

# Create app directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy project files
COPY . .

# Build nest project
RUN npm run build

# Expose port
EXPOSE 3002

# Start application
CMD ["node", "dist/main.js"]