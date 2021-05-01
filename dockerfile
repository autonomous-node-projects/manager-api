FROM node:14.16
MAINTAINER Daniel Goliszewski "taafeenn@gmail.com"
WORKDIR /usr/src/app/server
COPY package*.json ./
RUN npm install --only=prod
COPY . .
EXPOSE 3000
CMD ["npm", "start"]