# Usar a imagem oficial do Node.js
FROM node:16

# Definir o diretório de trabalho no contêiner
WORKDIR /app

# Copiar os arquivos do projeto para o contêiner
COPY . .

# Instalar as dependências do projeto
RUN npm install

# Executar o comando npm run (por exemplo, "npm run start")
CMD ["node", "index.js"]
