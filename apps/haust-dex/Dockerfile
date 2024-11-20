FROM node:16 AS build

WORKDIR /app

COPY package.json yarn.lock ./

COPY . .

RUN yarn

RUN yarn build

FROM nginx:alpine

COPY --from=build /app/build /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
