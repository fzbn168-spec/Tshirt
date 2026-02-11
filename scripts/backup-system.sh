#!/bin/bash

# Configuration
BACKUP_DIR="./backups"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
DB_CONTAINER="soletrade-backend"
DB_PATH="/app/data/prod.db"
UPLOADS_DIR="./backend/uploads"

# Create backup directory
mkdir -p "$BACKUP_DIR"

echo "[$(date)] Starting backup..."

# 1. Backup SQLite Database (Hot Backup using sqlite3 command inside container if available, else copy)
# Since sqlite3 CLI might not be in the minimal alpine image, we use a safe copy approach:
# We rely on the fact that SQLite handles concurrent reads well, but for absolute safety in production without WAL mode,
# one might pause writes. Here we assume standard copy is sufficient for this MVP scale or we can install sqlite3.
# Let's try to use the 'vacuum into' command if sqlite3 is available, otherwise cp.
echo "  -> Backing up database..."
docker exec $DB_CONTAINER sh -c "sqlite3 $DB_PATH \".backup '/app/data/backup.db'\"" 2>/dev/null

if [ $? -eq 0 ]; then
    # If sqlite3 command worked
    docker cp $DB_CONTAINER:/app/data/backup.db "$BACKUP_DIR/db_$TIMESTAMP.sqlite"
    docker exec $DB_CONTAINER rm /app/data/backup.db
else
    # Fallback to direct file copy (risk of corruption if write happens exactly now, but acceptable for MVP)
    echo "     (sqlite3 CLI not found, falling back to file copy)"
    docker cp $DB_CONTAINER:$DB_PATH "$BACKUP_DIR/db_$TIMESTAMP.sqlite"
fi

# 2. Backup Uploads
echo "  -> Backing up uploaded files..."
tar -czf "$BACKUP_DIR/uploads_$TIMESTAMP.tar.gz" -C "$UPLOADS_DIR" .

# 3. Cleanup Old Backups (Keep last 7 days)
echo "  -> Cleaning up old backups..."
find "$BACKUP_DIR" -name "db_*.sqlite" -type f -mtime +7 -delete
find "$BACKUP_DIR" -name "uploads_*.tar.gz" -type f -mtime +7 -delete

echo "[$(date)] Backup completed successfully!"
echo "Saved to: $BACKUP_DIR/db_$TIMESTAMP.sqlite"
