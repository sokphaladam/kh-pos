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

# Standalone mode requires public and static files to be copied to the standalone directory
RUN cp -r public .next/standalone/public && \
    cp -r .next/static .next/standalone/.next/static

# Create startup script inline
RUN echo `#!/bin/bash\n\
set -e\n\
echo "Starting L-POS..."\n\
if [ "$ENABLE_CRON" = "true" ]; then\n\
  echo "Starting cron service with health check endpoint..."\n\
  cd /usr/src/app\n\
  # Start a simple HTTP server for health checks on port ${PORT}\n\
  node -e "require(\"http\").createServer((req, res) => { res.writeHead(200); res.end(\"OK\"); }).listen(${PORT}, () => console.log(\"Health check server listening on port ${PORT}\"));" &\n\
  # Run the cron service\n\
  exec npm run cron\n\
else\n\
  echo "Starting Next.js server..."\n\
  cd /usr/src/app/.next/standalone\n\
  exec node server.js\n\
fi\n\
` > /usr/src/app/start.sh && chmod +x /usr/src/app/start.sh

CMD [ "/usr/src/app/start.sh" ]