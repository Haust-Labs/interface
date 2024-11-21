FROM node:16 AS build

WORKDIR /app

COPY ./apps/haust-dex ./

RUN yarn install --immutable

RUN git config --global user.name "JanTrojanowski-40k"
RUN yarn add https://github.com/Haust-Labs/deprecated-haust-smart-order-router


RUN yarn build

FROM nginx:alpine

RUN rm /etc/nginx/conf.d/default.conf

COPY nginx.conf /etc/nginx/conf.d/nginx.conf

COPY --from=build /app/build /usr/share/nginx/html

CMD ["nginx", "-g", "daemon off;"]

