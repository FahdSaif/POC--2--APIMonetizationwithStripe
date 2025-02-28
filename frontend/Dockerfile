# Use Nginx as the base image
FROM nginx:alpine

# Set working directory
WORKDIR /usr/share/nginx/html

# Remove default nginx website
RUN rm -rf ./*

# Copy frontend files into the container
COPY . .

# Expose port 80
EXPOSE 80

# Start Nginx
CMD ["nginx", "-g", "daemon off;"]
