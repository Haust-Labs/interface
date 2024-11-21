FROM node:16 AS build
ARG TOKEN
# WORKDIR /app

# COPY ./apps/haust-dex ./

# RUN yarn install --immutable

# Используем секрет и устанавливаем переменную окружения
ENV G_TOKEN=$TOKEN
RUN echo "TOKEN IS: $G_TOKEN"
# RUN yarn add @uniswap/smart-order-router@git+https://$TOKEN@github.com/Haust-Labs/deprecated-haust-smart-order-router


RUN yarn build

FROM nginx:alpine

RUN rm /etc/nginx/conf.d/default.conf

COPY nginx.conf /etc/nginx/conf.d/nginx.conf

COPY --from=build /app/build /usr/share/nginx/html

CMD ["nginx", "-g", "daemon off;"]

