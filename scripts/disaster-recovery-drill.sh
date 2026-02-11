#!/bin/bash
# Disaster Recovery Drill Script
# WARNING: This script will DELETE your production database and restore it from the latest backup.

DB_CONTAINER="soletrade-backend"
DB_PATH="/app/data/prod.db"
BACKUP_DIR="./backups"

echo "🚨 STARTING DISASTER RECOVERY DRILL 🚨"
echo "-------------------------------------"

# 1. Trigger a Backup First (to ensure we have something to restore)
echo "1️⃣  Taking fresh backup..."
./scripts/backup-system.sh

# 2. Simulate Disaster
echo ""
echo "2️⃣  Simulating DISASTER (Deleting active database)..."
docker exec $DB_CONTAINER rm $DB_PATH
echo "   ❌ Database deleted!"

# Verify deletion
echo "   🔍 Verifying deletion..."
if docker exec $DB_CONTAINER ls $DB_PATH 2>/dev/null; then
    echo "   ❌ Error: Database still exists!"
    exit 1
else
    echo "   ✅ Database confirmed gone."
fi

# 3. Restore
echo ""
echo "3️⃣  Starting RESTORE process..."
# Find latest backup
LATEST_BACKUP=$(ls -t $BACKUP_DIR/db_*.sqlite | head -n 1)

if [ -z "$LATEST_BACKUP" ]; then
    echo "   ❌ Critical Error: No backup file found!"
    exit 1
fi

echo "   📂 Found latest backup: $LATEST_BACKUP"
echo "   🔄 Restoring..."

docker cp "$LATEST_BACKUP" $DB_CONTAINER:$DB_PATH

# 4. Verify Recovery
echo ""
echo "4️⃣  Verifying Recovery..."
# Check file existence
if docker exec $DB_CONTAINER ls $DB_PATH >/dev/null; then
    echo "   ✅ Database file restored."
    
    # Optional: Run a simple query to check integrity (requires sqlite3 in container)
    # echo "   🔍 Checking integrity..."
    # docker exec $DB_CONTAINER sqlite3 $DB_PATH "SELECT count(*) FROM User;"
    
    echo "-------------------------------------"
    echo "🎉 DRILL SUCCESSFUL: System recovered from total data loss!"
    echo "-------------------------------------"
else
    echo "   ❌ Restore failed: File not found in container."
    exit 1
fi
