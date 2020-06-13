# Imagen a utilizar
FROM node:current-alpine3.11

# Create app directory
WORKDIR /usr/src/guinote

# Install app dependencies
# A wildcard is used to ensure both package.json AND package-lock.json are copied
# where available (npm@5+)
COPY package*.json ./

# Instalar package.json
RUN npm install

# Bundle app source
COPY . .

# Puerto que usa la aplicacion
EXPOSE 3000

# Comando de arranque
CMD [ "ts-node", "guinoteserver.ts" ]
