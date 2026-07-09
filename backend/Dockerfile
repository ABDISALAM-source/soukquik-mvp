FROM node:20-alpine
WORKDIR /app
COPY backend/package*.json ./
RUN npm install
COPY backend/ .
COPY database/ /database
RUN npm run build
EXPOSE 4000
CMD ["node", "dist/server.js"]
