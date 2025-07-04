# syntax=docker/dockerfile:1.4

FROM --platform=$BUILDPLATFORM node:14.21.3-bullseye-slim as builder

WORKDIR /app

COPY . .
RUN npm ci
RUN npm run build

FROM nginx:stable-alpine

COPY ./nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/dist/liff-nok-air /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
