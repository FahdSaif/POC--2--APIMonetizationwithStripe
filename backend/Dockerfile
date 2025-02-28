# Use Node.js as the base image
FROM node:18

# Set the working directory inside the container
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies (including axios)
RUN npm install axios

# Install other dependencies
RUN npm install

# Copy the application files
COPY . .

# Expose port 3000
EXPOSE 3000

# Start the application
CMD ["node", "server.js"]
