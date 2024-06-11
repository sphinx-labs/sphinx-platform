FROM node:19.7-alpine3.16
COPY ./services/utilities ./services/utilities
COPY ./services/init ./
RUN yarn install --pure-lockfile --non-interactive --network-timeout 100000
RUN yarn build:prisma
CMD [ "yarn", "start" ]
