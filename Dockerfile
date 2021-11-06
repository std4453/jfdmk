FROM node:16
WORKDIR /usr/src/app

COPY package.json ./
COPY yarn.lock ./
RUN yarn install --production=true
COPY static ./static
COPY server ./server
COPY .env ./.env
EXPOSE 10086
VOLUME /usr/src/app/data
CMD ["yarn", "start"]
