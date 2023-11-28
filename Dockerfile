FROM node:16
WORKDIR /usr/src/app
# RUN npm install bpmn-server@1.3.15
# COPY package*.json ./
COPY . .
RUN npm install
EXPOSE 3000
CMD ["npm", "start"]
