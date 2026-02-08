# Check if docker is installed
if (!(Get-Command "docker" -ErrorAction SilentlyContinue)) {
    Write-Error "Docker is not installed or not in the PATH. Please install Docker Desktop to proceed."
    exit 1
}

# Define compose command (prefer 'docker compose' over 'docker-compose')
$composeCmd = "docker compose"
if (!(docker compose version 2>&1 | Select-String "Docker Compose")) {
    if (Get-Command "docker-compose" -ErrorAction SilentlyContinue) {
        $composeCmd = "docker-compose"
    } else {
        Write-Warning "'docker compose' plugin not found, nor 'docker-compose'. Assuming 'docker compose' might work or user needs to install it."
    }
}

Write-Host "Using compose command: $composeCmd"

# Stop existing containers
Write-Host "Stopping existing containers..."
Invoke-Expression "$composeCmd down"

# Build new images
Write-Host "Building new images..."
Invoke-Expression "$composeCmd build --no-cache"

# Start containers
Write-Host "Starting containers..."
Invoke-Expression "$composeCmd up -d"

# Wait for backend to be ready
Write-Host "Waiting for services to initialize..."
Start-Sleep -Seconds 15

# Run migrations
# Note: Ensure the prod.db file exists or is created by Prisma
Write-Host "Running database migrations..."
Invoke-Expression "$composeCmd exec -T backend npx prisma migrate deploy"

Write-Host "Deployment complete! Access Frontend at http://localhost:3000"
