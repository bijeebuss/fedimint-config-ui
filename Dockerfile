from node:hydrogen-bullseye-slim

workdir /app

copy package*.json .
run npm install -ci

copy . .
run npm run build

cmd npm run start

expose 3000
