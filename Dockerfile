FROM node:16 AS build

WORKDIR /app

COPY ./apps/haust-dex ./

RUN yarn install --immutable

# Используем секрет и устанавливаем переменную окружения
RUN --mount=type=secret,id=GITHUB_TOKEN \
  export GITHUB_TOKEN=$(cat /run/secrets/GITHUB_TOKEN) && \
  git config --global url."https://$GITHUB_TOKEN@github.com/".insteadOf "https://github.com/" && \
  yarn add @uniswap/smart-order-router@git+https://github.com/Haust-Labs/deprecated-haust-smart-order-router.git

RUN yarn build

FROM nginx:alpine

RUN rm /etc/nginx/conf.d/default.conf

COPY nginx.conf /etc/nginx/conf.d/nginx.conf

COPY --from=build /app/build /usr/share/nginx/html

CMD ["nginx", "-g", "daemon off;"]
