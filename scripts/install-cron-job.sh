#!/bin/bash

# ====================================================
# SoleTrade Automated Backup Cron Installer
# ====================================================

# 1. Resolve Absolute Paths
# Gets the directory where this script is located (scripts/)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# Parent directory is the Project Root
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
BACKUP_SCRIPT="$PROJECT_ROOT/scripts/backup-system.sh"
LOG_FILE="/var/log/soletrade_backup.log"

echo "------------------------------------------------"
echo "📂 Project Root:  $PROJECT_ROOT"
echo "📜 Backup Script: $BACKUP_SCRIPT"
echo "📝 Log File:      $LOG_FILE"
echo "------------------------------------------------"

# 2. Validation
if [ ! -f "$BACKUP_SCRIPT" ]; then
    echo "❌ Error: Backup script not found at $BACKUP_SCRIPT"
    exit 1
fi

# 3. Permission Fix
echo "🔧 Setting executable permissions..."
chmod +x "$BACKUP_SCRIPT"

# 4. Define Cron Job
# Format: 0 3 * * * /path/to/script >> /var/log/app.log 2>&1
CRON_JOB="0 3 * * * $BACKUP_SCRIPT >> $LOG_FILE 2>&1"

# 5. Idempotency Check (Don't add if exists)
EXISTING_CRON=$(crontab -l 2>/dev/null)
if echo "$EXISTING_CRON" | grep -Fq "$BACKUP_SCRIPT"; then
    echo "⚠️  Cron job already exists. Skipping."
    echo "   Existing entry:"
    echo "$EXISTING_CRON" | grep -F "$BACKUP_SCRIPT"
    exit 0
fi

# 6. Install Cron Job
# We echo the current crontab + the new job into the crontab command
echo "🚀 Installing Cron Job..."
(echo "$EXISTING_CRON"; echo "$CRON_JOB") | crontab -

if [ $? -eq 0 ]; then
    echo "✅ Success! Backup scheduled for daily at 03:00 AM."
    echo "   Run 'crontab -l' to verify."
else
    echo "❌ Failed to update crontab. Try running with sudo?"
    exit 1
fi
