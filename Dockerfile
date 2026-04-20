# Using Node.js as the base image
FROM node:20-alpine

WORKDIR /app

# Copy package.json and package-lock.json to the working directory
COPY package*.json ./
RUN npm install

# Copy the rest of the application code
COPY . .

# Expose the port that the React app will run on
EXPOSE 5173

# Start the React application
CMD ["npm", "run", "dev", "--", "--host"]