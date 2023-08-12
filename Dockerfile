FROM --platform=linux/amd64 node:18
WORKDIR /user/src/app
COPY ./package*.json ./
RUN npm ci --omit=dev
COPY . .
EXPOSE 8080
CMD ["node", "server.js"]
