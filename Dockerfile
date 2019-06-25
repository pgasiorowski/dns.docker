FROM node:10
EXPOSE 53

RUN mkdir /app
WORKDIR /app
ADD package.json /app
ADD server.js /app

# Install dependencies
RUN npm install

CMD node /app/server.js