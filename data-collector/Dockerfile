# c:\realtimechart\realtimechart\data-collector\Dockerfile
FROM node:18
WORKDIR /app
COPY . .
RUN npm install
CMD ["node", "server-collector.js"]