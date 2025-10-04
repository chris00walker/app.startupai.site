#!/bin/bash
# Helper script to copy migration SQL to clipboard

echo "📋 Copying migration SQL to clipboard..."
echo ""

MIGRATION_FILE="supabase/migrations/00007_trial_usage_counters.sql"

if [ -f "$MIGRATION_FILE" ]; then
    # Try different clipboard commands based on OS
    if command -v xclip &> /dev/null; then
        cat "$MIGRATION_FILE" | xclip -selection clipboard
        echo "✅ Migration SQL copied to clipboard (using xclip)"
    elif command -v xsel &> /dev/null; then
        cat "$MIGRATION_FILE" | xsel --clipboard
        echo "✅ Migration SQL copied to clipboard (using xsel)"
    elif command -v pbcopy &> /dev/null; then
        cat "$MIGRATION_FILE" | pbcopy
        echo "✅ Migration SQL copied to clipboard (using pbcopy)"
    else
        echo "⚠️  No clipboard utility found. Here's the migration SQL:"
        echo ""
        echo "=========================================="
        cat "$MIGRATION_FILE"
        echo "=========================================="
        echo ""
        echo "Please copy the above SQL manually."
    fi
    
    echo ""
    echo "Next steps:"
    echo "1. Go to: https://supabase.com/dashboard/project/eqxropalhxjeyvfcoyxg/sql"
    echo "2. Paste the SQL (Ctrl+V or Cmd+V)"
    echo "3. Click 'Run'"
    echo ""
else
    echo "❌ Migration file not found: $MIGRATION_FILE"
    exit 1
fi
