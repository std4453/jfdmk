FROM node:16
WORKDIR /usr/src/app

COPY package.json ./
COPY yarn.lock ./
RUN yarn install --production=true
COPY server ./server
COPY dist ./dist
EXPOSE 10086
VOLUME /usr/src/app/data
CMD ["yarn", "start"]
