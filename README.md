# AttachmentAnalyzer

A full-stack property listing platform built with React, TypeScript, Node.js, Express, MongoDB, and PostgreSQL. Features authentication, property CRUD, favorites, recommendations, and more.

## Features
- User authentication (JWT)
- Property CRUD (create, read, update, delete)
- Favorites and recommendations
- Responsive UI with React and Tailwind CSS
- PostgreSQL (Drizzle ORM) and MongoDB support
- Ready for deployment on Render or similar platforms

## Getting Started

### Prerequisites
- Node.js 20+
- Docker (for deployment)
- (Optional) MongoDB Atlas and PostgreSQL database

### Development

1. **Install dependencies:**
   ```bash
   npm install
   cd client && npm install
   ```
2. **Configure environment variables:**
   - Copy `.env.example` to `.env` in both root and `server/config/` as needed.
3. **Run locally:**
   ```bash
   # In one terminal
   npm run dev
   # In another terminal (for client)
   cd client && npm run dev
   ```

### Deployment (Render, Railway, etc.)

1. **Build the app:**
   ```bash
   npm run build
   cd client && npm run build
   ```
2. **Deploy using Docker:**
   - Use the provided `Dockerfile` for full-stack deployment.
   - Set environment variables in your Render/Railway dashboard.

## Docker
See the `Dockerfile` for details. The container exposes port 8080 by default.

## License
MIT
