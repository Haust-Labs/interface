FROM node:18.12.1 AS build

WORKDIR /app

COPY . ./

RUN yarn install --immutable

RUN yarn turbo run @uniswap/interface#prepare && yarn turbo run uniswap#prepare

RUN yarn web build:production

FROM nginx:alpine

RUN rm /etc/nginx/conf.d/default.conf

COPY nginx.conf /etc/nginx/conf.d/nginx.conf

COPY --from=build app/apps/web/build /usr/share/nginx/html

CMD ["nginx", "-g", "daemon off;"]
