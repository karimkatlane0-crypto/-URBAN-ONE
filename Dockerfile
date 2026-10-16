FROM node:22-alpine
WORKDIR /app
COPY . .
EXPOSE 8787
CMD ["node","services/api/server.mjs"]
