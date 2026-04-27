# Use an official lightweight Node.js 20 image
FROM node:20-alpine

# Set the working directory in the container
WORKDIR /app

# Copy package.json and package-lock.json first to leverage Docker cache
COPY package*.json ./

# Install backend dependencies
RUN npm install

# Copy the remaining project files to the working directory
COPY . .

# Expose the port the microservice runs on
EXPOSE 5000

# Start the application
CMD ["node", "index.js"]
