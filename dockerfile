# Build the Frontend
FROM node:20-alpine as frontend-builder
WORKDIR /server/Frontend    
COPY ./Frontend ./
RUN npm install 
RUN npm run build

# Build Backend and serve
FROM node:20-alpine as backend-builder
WORKDIR /server/Backend    
COPY ./Backend ./
RUN npm install 

# Copy built frontend from the previous stage to the correct location
COPY --from=frontend-builder /server/Frontend/dist /server/Frontend/dist

EXPOSE 3000
CMD ["node", "server.js"]
