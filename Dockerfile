# Stage 1: Build the React App
FROM node:18-alpine AS build

WORKDIR /app

# Define Build Arguments (Vite needs these at build time)
ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_ANON_KEY

# Fail if these args are missing (Optional, but good for debugging)
RUN test -n "$VITE_SUPABASE_URL" || (echo "VITE_SUPABASE_URL is not set" && false)
RUN test -n "$VITE_SUPABASE_ANON_KEY" || (echo "VITE_SUPABASE_ANON_KEY is not set" && false)

# Set them as environment variables for the build process
ENV VITE_SUPABASE_URL=$VITE_SUPABASE_URL
ENV VITE_SUPABASE_ANON_KEY=$VITE_SUPABASE_ANON_KEY

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

# Stage 2: Serve with Nginx
FROM nginx:alpine

# Copy built assets from builder stage
COPY --from=build /app/dist /usr/share/nginx/html

# Custom Nginx Config for SPA (React Router)
RUN echo 'server { \
    listen 80; \
    location / { \
        root /usr/share/nginx/html; \
        index index.html index.htm; \
        try_files $uri $uri/ /index.html; \
    } \
}' > /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
