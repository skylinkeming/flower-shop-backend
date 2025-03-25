FROM --platform=linux/amd64 node:18
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm ci --only=production --legacy-peer-deps
COPY . .
EXPOSE 8080
CMD ["npm", "start"]
