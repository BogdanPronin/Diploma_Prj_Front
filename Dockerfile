FROM node:20.19.1-alpine AS builder
ENV HOME=/usr/src/app
RUN mkdir -p $HOME
WORKDIR $HOME
COPY package.json package-lock.json $HOME
RUN --mount=type=cache,target=$HOME/.npm \
    npm set cache $HOME/.npm && \
    npm ci
COPY . $HOME
RUN --mount=type=cache,target=$HOME/.npm \
    npm set cache $HOME/.npm && \
    npm run build

FROM nginx:alpine
COPY --from=builder /usr/src/app/build /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
