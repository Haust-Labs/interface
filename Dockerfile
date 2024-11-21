FROM node:16 AS build

WORKDIR /app

COPY ./apps/haust-dex ./

RUN yarn install --immutable

ARG GITHUB_TOKEN
RUN echo "Using GITHUB_TOKEN: $GITHUB_TOKEN" && \
    yarn add @uniswap/smart-order-router@git+https://$GITHUB_TOKEN@github.com/Haust-Labs/deprecated-haust-smart-order-router

RUN yarn build

FROM nginx:alpine

RUN rm /etc/nginx/conf.d/default.conf

COPY nginx.conf /etc/nginx/conf.d/nginx.conf

COPY --from=build app/build /usr/share/nginx/html

CMD ["nginx", "-g", "daemon off;"]
