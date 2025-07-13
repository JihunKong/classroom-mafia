# playwright/Dockerfile
# Dockerfile for Playwright test runner

FROM mcr.microsoft.com/playwright:v1.45.0-focal

# Set working directory
WORKDIR /app

# Copy package files
COPY package.json package-lock.json ./

# Install dependencies
RUN npm ci --only=production

# Install Playwright browsers
RUN npx playwright install --with-deps

# Copy test files
COPY . .

# Create directories for test results
RUN mkdir -p test-results playwright-report

# Set environment variables
ENV NODE_ENV=test
ENV CI=true

# Run tests by default
CMD ["npm", "run", "test"]