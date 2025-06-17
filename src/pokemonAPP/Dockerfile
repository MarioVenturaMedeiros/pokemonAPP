FROM node:18

# Install system dependencies
RUN apt-get update && \
    apt-get install -y python3 git && \
    rm -rf /var/lib/apt/lists/*

# Working directory
WORKDIR /APP

# Install dependencies
COPY package*.json ./
RUN npm install

# Install ngrok to support tunnels (optional)
RUN npm install -g @expo/ngrok

# Copy project files
COPY . .

# Expose Expo ports
EXPOSE 19000 19001 19002

# Make DevTools accessible
ENV EXPO_DEVTOOLS_LISTEN_ADDRESS=0.0.0.0

# Start Expo
CMD ["npx", "expo", "start", "--lan"]
