FROM node:22-bookworm-slim AS build
WORKDIR /app
COPY package.json package-lock.json ./
COPY backend/package.json backend/package-lock.json ./backend/
COPY frontend/package.json frontend/package-lock.json ./frontend/
# package-lock.json was created on Windows and lacks Rolldown's Linux optional binary.
# Install the build-only binary explicitly so Vite works reproducibly in the Linux image.
RUN npm ci --ignore-scripts && npm install --no-save --workspace=frontend @rolldown/binding-linux-x64-gnu@1.2.7 lightningcss-linux-x64-gnu@1.33.0
COPY frontend ./frontend
WORKDIR /app/frontend
RUN npm run build

FROM nginx:1.27-alpine
COPY deploy/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/frontend/dist /usr/share/nginx/html
EXPOSE 80
