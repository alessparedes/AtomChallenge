
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm install --legacy-peer-deps

COPY . .

# Compilamos para producción
# Ajusta el comando si usas una configuración diferente
RUN npm run build -- --configuration production

# =======================================
# STAGE 2: Serve (Servidor Nginx)
# =======================================
FROM nginx:alpine

# Copiamos el archivo de configuración de Nginx que creamos
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copiamos los archivos compilados desde el Stage 1
# OJO: Verifica en tu angular.json dónde sale el output (dist/nombre-proyecto)
# Reemplaza 'nombre-de-tu-app' por el nombre real de tu carpeta en dist
COPY --from=builder /app/dist/frontend/browser /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]