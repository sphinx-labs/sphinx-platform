FROM node:19.7-alpine3.16
WORKDIR /opt/app
COPY ./services/artifact-generator ./
COPY ./services/utilities ./services/utilities
COPY ./services/artifact-generator/package.json ./
RUN yarn install --pure-lockfile --non-interactive --network-timeout 100000
RUN yarn build:prisma
CMD [ "yarn", "start" ]
