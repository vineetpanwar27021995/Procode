# Use official Node.js image
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install --production

# Copy the rest of the app
COPY . .

# Expose the port the app runs on (e.g., 4000)
EXPOSE 8081

# Start the app
CMD ["node", "server.js"]