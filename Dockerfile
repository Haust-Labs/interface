FROM node:latest AS build

WORKDIR /app

COPY package.json yarn.lock ./

COPY . .

RUN yarn install --frozen-lockfile

RUN yarn web build:production

FROM nginx:alpine

RUN rm /etc/nginx/conf.d/default.conf

COPY nginx.conf /etc/nginx/conf.d/nginx.conf

COPY --from=build app/apps/web/build /usr/share/nginx/html

CMD ["nginx", "-g", "daemon off;"]
