# Usa una imagen de Node.js
FROM node:20.17.0

# Crea el directorio de trabajo en el contenedor
RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

# Copia los archivos de dependencias y luego instala los paquetes
COPY package*.json ./
RUN npm install

# Copia el resto del código
COPY . .

# Expone el puerto 8080
EXPOSE 8080

# Comando por defecto para iniciar la aplicación
CMD ["npm", "start"]