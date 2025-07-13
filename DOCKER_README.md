# 🐳 Docker Setup for Korean Mafia Game

This document explains how to use Docker to run the Korean Mafia Game locally.

## Prerequisites

- Docker Desktop installed and running
- Docker Compose (included with Docker Desktop)
- Git (for cloning the repository)

## Quick Start

### Development Environment

1. **Start the development environment:**
   ```bash
   npm run docker:dev
   ```
   
   Or use the script directly:
   ```bash
   ./scripts/docker-dev.sh up
   ```

2. **Access the application:**
   - Client: http://localhost:5173
   - Server: http://localhost:3001

3. **View logs:**
   ```bash
   npm run docker:dev:logs
   ```

4. **Stop the environment:**
   ```bash
   npm run docker:dev:down
   ```

### Production Environment

1. **Build production images:**
   ```bash
   npm run docker:prod:build
   ```

2. **Start production environment:**
   ```bash
   npm run docker:prod
   ```

3. **Access the application:**
   - Client: http://localhost
   - Server: http://localhost:3001

## Docker Commands

### Development Commands
```bash
# Start development environment
npm run docker:dev

# Build development images
npm run docker:dev:build

# Stop development environment
npm run docker:dev:down

# View logs
npm run docker:dev:logs

# Clean up Docker resources
npm run docker:clean
```

### Production Commands
```bash
# Build production images
npm run docker:prod:build

# Start production environment
npm run docker:prod

# Stop production environment
npm run docker:prod:down

# Full deployment (pull, build, restart)
npm run docker:prod:deploy
```

### Using Script Commands Directly

#### Development Script (`./scripts/docker-dev.sh`)
```bash
./scripts/docker-dev.sh up          # Start development environment
./scripts/docker-dev.sh up-d        # Start in detached mode
./scripts/docker-dev.sh down        # Stop environment
./scripts/docker-dev.sh restart     # Restart all services
./scripts/docker-dev.sh build       # Build images
./scripts/docker-dev.sh rebuild     # Rebuild without cache
./scripts/docker-dev.sh logs        # View all logs
./scripts/docker-dev.sh logs client # View client logs only
./scripts/docker-dev.sh shell server # Open shell in server container
./scripts/docker-dev.sh clean       # Clean up resources
```

#### Production Script (`./scripts/docker-prod.sh`)
```bash
./scripts/docker-prod.sh build      # Build production images
./scripts/docker-prod.sh up         # Start production environment
./scripts/docker-prod.sh down       # Stop environment
./scripts/docker-prod.sh restart    # Restart all services
./scripts/docker-prod.sh logs       # View logs
./scripts/docker-prod.sh status     # Show container status
./scripts/docker-prod.sh backup     # Create backup
./scripts/docker-prod.sh deploy     # Full deployment
./scripts/docker-prod.sh health     # Check health status
```

## Architecture

### Container Structure
- **Client Container**: 
  - Development: Vite dev server with hot reload
  - Production: Nginx serving static files
- **Server Container**: 
  - Node.js Express server with Socket.io
  - Health checks configured

### Networking
- Custom Docker network (`mafia-network`) for container communication
- Socket.io WebSocket support configured
- CORS properly set up for client-server communication

### Volumes (Development)
- Source code mounted for hot reload
- Shared code accessible to both containers
- node_modules excluded from mounts

## Environment Variables

### Development
Create a `.env` file in the root directory:
```env
# Client
VITE_SERVER_URL=http://localhost:3001
VITE_SOCKET_URL=http://localhost:3001

# Server
PORT=3001
CLIENT_URL=http://localhost:5173
```

### Production
Create a `.env.production` file:
```env
# Client
VITE_SERVER_URL=https://your-domain.com:3001
VITE_SOCKET_URL=https://your-domain.com:3001

# Server
PORT=3001
CLIENT_URL=https://your-domain.com
```

## Troubleshooting

### Port Already in Use
If you get a port conflict error:
```bash
# Kill processes using the ports
npx kill-port 5173 3001

# Or change ports in docker-compose files
```

### Container Won't Start
1. Check Docker Desktop is running
2. Check logs: `npm run docker:dev:logs`
3. Rebuild images: `npm run docker:dev:build`

### Hot Reload Not Working
1. Ensure volumes are mounted correctly
2. Check file permissions
3. Restart containers: `./scripts/docker-dev.sh restart`

### Socket.io Connection Issues
1. Check CORS settings in server
2. Verify environment variables
3. Check network connectivity between containers

## Advanced Usage

### Debugging
The server container exposes port 9229 for Node.js debugging in development mode.

### Custom Network Configuration
Edit `docker-compose.yml` to modify network settings.

### Resource Limits
Production containers have resource limits configured. Adjust in `docker-compose.prod.yml` if needed.

### SSL/HTTPS
For production HTTPS:
1. Add SSL certificates to nginx configuration
2. Update environment variables
3. Expose port 443 in docker-compose.prod.yml

## File Structure
```
/
├── .dockerignore
├── docker-compose.yml         # Base configuration
├── docker-compose.dev.yml     # Development overrides
├── docker-compose.prod.yml    # Production overrides
├── client/
│   ├── Dockerfile            # Multi-stage build
│   ├── .dockerignore
│   └── nginx.conf           # Production nginx config
├── server/
│   ├── Dockerfile            # Multi-stage build
│   └── .dockerignore
└── scripts/
    ├── docker-dev.sh        # Development helper
    └── docker-prod.sh       # Production helper
```