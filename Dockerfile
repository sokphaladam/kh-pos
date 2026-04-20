FROM node:20.12.0

RUN apt-get update && apt-get install -y \ 
    wget \ 
    ca-certificates \ 
    fonts-liberation \ 
    libnss3 \ 
    libnspr4 \ 
    libatk1.0-0 \ 
    libatk-bridge2.0-0 \ 
    libcups2 \ 
    libdrm2 \ 
    libxkbcommon0 \ 
    libxcomposite1 \ 
    libxdamage1 \ 
    libxrandr2 \ 
    libgbm1 \ 
    libasound2 \ 
    libx11-xcb1 \ 
    libxext6 \ 
    libxfixes3 \ 
    && rm -rf /var/lib/apt/lists/*

ARG DB_MAIN
ENV DB_MAIN=${DB_MAIN}
ARG PORT
ENV PORT=${PORT}

# Create app directory
WORKDIR /usr/src/app

# Install app dependencies
# A wildcard is used to ensure both package.json AND package-lock.json are copied
# where available (npm@5+)
COPY package*.json ./

RUN npm install
# If you are building your code for production
# RUN npm ci --only=production

# Bundle app source
COPY . .
RUN npm run build

EXPOSE ${PORT}

CMD ["sh", "-c", "npm start -- -p $PORT"]