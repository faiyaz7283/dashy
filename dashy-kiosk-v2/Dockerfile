FROM node:24-alpine AS build

WORKDIR /app

# Install pnpm (corepack in Node 24+ no longer creates PATH shims)
RUN npm install -g pnpm@latest

# Accept build arg for API URL
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

COPY . .
RUN pnpm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
