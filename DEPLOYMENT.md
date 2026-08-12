# Deployment Strategy: Food Rescue Network

This document details the production architecture, deployment strategy, and environment configuration for the Food Rescue Network.

## 1. Production Architecture Overview

The system is containerized using Docker and is designed to run in a typical cloud infrastructure (e.g., AWS, Render, Railway, or DigitalOcean).

### Components:
- **Frontend (Client)**: React SPA built with Vite, served via Nginx.
- **Backend (Server)**: Node.js/Express REST API serving as the application core.
- **Database**: PostgreSQL (managed service recommended for production, e.g., Supabase, Neon, RDS).
- **Media Storage**: Cloudinary for decoupled, secure image uploads.
- **Proxy/Ingress**: Nginx (handling reverse proxying, SSL termination, and static asset delivery).

---

## 2. Environment Configuration

### Secrets Management
Secrets must never be committed to version control. In production, use the platform's secret manager (e.g., AWS Secrets Manager, Render Environment Variables).

#### Required Backend Variables (`server/.env`):
```env
# Server
PORT=5000
NODE_ENV=production
CLIENT_URL=https://app.foodrescue.org

# Database
DATABASE_URL=postgresql://user:pass@host:5432/db?schema=public

# Authentication
JWT_SECRET=your-secure-64-byte-secret-key
JWT_EXPIRES_IN=24h

# Cloudinary
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

#### Required Frontend Variables (`client/.env.production`):
```env
VITE_API_URL=https://api.foodrescue.org/api
```

---

## 3. Infrastructure & Deployment Steps

### Option A: Fully Managed (Render / Railway) - *Recommended*

This is the easiest path for deployment, requiring zero manual server configuration.

1. **Database**: 
   - Provision a PostgreSQL database (e.g., on Render or Supabase).
   - Obtain the connection string.
2. **Backend**:
   - Create a new Web Service pointing to the `server/` directory.
   - Build Command: `npm install && npx prisma generate`
   - Start Command: `npx prisma migrate deploy && node src/server.js`
   - Add all Backend Environment Variables.
3. **Frontend**:
   - Create a new Static Site pointing to the `client/` directory.
   - Build Command: `npm install && npm run build`
   - Publish Directory: `dist`
   - Add the `VITE_API_URL` environment variable pointing to the Backend service URL.

### Option B: Docker Compose (VPS / EC2)

For deploying to a single Virtual Private Server (VPS) using Docker Compose.

1. **Provision Server**: Create a generic Linux instance (Ubuntu 22.04 LTS).
2. **Install Docker**: Install Docker Engine and Docker Compose.
3. **Configure Environment**: Create `.env` in the project root containing all combined secrets.
4. **Deploy**:
   ```bash
   git clone <repository>
   cd <repository>
   docker-compose -f docker-compose.prod.yml up -d --build
   ```
   *(Note: You will need to create a `docker-compose.prod.yml` that overrides the dev mounts and handles Let's Encrypt SSL via certbot or Traefik).*

---

## 4. Production Hardening applied in Stage 20

To ensure production readiness, the following security and optimization measures have been implemented:

- **Pagination**: All major list endpoints (Admin, Donations, NGOs, Volunteers) are paginated to prevent memory exhaustion and slow queries.
- **Rate Limiting**: `express-rate-limit` prevents brute-force attacks on auth endpoints (10 req/15min) and DoS attacks on general APIs (100 req/15min).
- **Security Headers**: `helmet` is enabled for safe HTTP headers.
- **Dockerization**: The frontend and backend are completely decoupled and containerized with non-root users.
- **CI/CD**: GitHub Actions workflows validate linting and testing on every push to main.

---

## 5. Post-Deployment Verification

After deploying, perform these checks:
1. **Health Check**: Verify `https://api.foodrescue.org/health` returns `200 OK`.
2. **Migrations**: Verify Prisma ran `migrate deploy` successfully on startup.
3. **CORS**: Attempt to login via the frontend and verify CORS headers match the `CLIENT_URL`.
4. **Uploads**: Verify image uploads correctly route to Cloudinary and not the local file system.
