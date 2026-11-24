FROM node:22 AS build

WORKDIR /app

# devnet or mainnet; the build fails without it
ARG REACT_APP_NETWORK
ENV REACT_APP_NETWORK=$REACT_APP_NETWORK

COPY package.json yarn.lock ./

COPY . .

RUN yarn

RUN yarn build

FROM nginx:alpine

COPY --from=build /app/build /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
