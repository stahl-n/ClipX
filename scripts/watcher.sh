#!/bin/bash

# ---- Configuration ----
WATCH_DIR="$HOME/Videos/ClipX/Recordings"
API_URL="http://localhost:3000/upload"
API_KEY="your-secret-api-key-please-change-this" # Must match the API key in your server configuration (docker-compose.yml environment variable)
# -----------------------

# Check if inotifywait is installed
if ! command -v inotifywait &> /dev/null; then
    echo "Error: inotify-tools is not installed."
    echo "Install it with: sudo apt install inotify-tools"
    exit 1
fi

echo "Watching directory: $WATCH_DIR"

# Watch for files uploaded to the directory and upload them to the server
inotifywait -m -e close_write --format '%f' "$WATCH_DIR" | while read FILE
do
    # Only upload video files
    if [[ "$FILE" == *.mp4 ]] || [[ "$FILE" == *.mkv ]]; then
        echo "New clip detected: $FILE"
        echo "Uploading to $API_URL..."
        
        # Upload to server
        RESPONSE=$(curl -s -H "x-api-key: $API_KEY" -F "file=@$WATCH_DIR/$FILE" "$API_URL")
        
        # Extract 
        URL=$(echo $RESPONSE | grep -oP '(?<="url":")[^"]*')
        
        echo "Upload successful!"
        echo "Link: $URL"
        
        # If xclip is installed, copy the URL to the clipboard
        if command -v xclip &> /dev/null; then
            echo -n "$URL" | xclip -selection clipboard
            echo "Link copied to clipboard!"
        fi
        echo "--------------------------------------"
    fi
done