FROM node:latest

RUN mkdir -p /usr/src/app

RUN mkdir -p /usr/src/data

WORKDIR /usr/src/app

COPY package.json /usr/src/app/

RUN npm install

RUN npm install pm2 -g

COPY . /usr/src/app

EXPOSE 3000

ENV DB_HOST="mongo"

CMD [ "npm", "run-script", "start-dev" ]
