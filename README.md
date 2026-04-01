# ClipX
A minimalist, self-hosted media pipeline for gamers. 

### Why ClipX?
Sharing short clips (e.g., Gaming Clips) should be instant. ClipX automates the bridge between your recording software (e.g. OBS) and a private web-link.

### Tech Stack
- **Backend:** Node.js, TypeScript, Fastify
- **Automation:** Bash + inotify-tools
- **Containerization:** Docker

### Features
- [x] Automated folder watching.
- [x] Instant upload via CLI.
- [x] Zero-config HTML5 Video Player.
- [x] Automatically copy URL to your clipboard.

# Limitations
While many of the limitations listed below, are because of the idea of a 
minimalistic solution, others might be implemented in the future.

- [ ] Only mp4 files can be uploaded
- [ ] No support for multiple users
- [ ] No password protection
- [ ] Linux only

### Installation & Setup

#### 1. Server Setup (Docker)

1. **Create a `docker-compose.yml` file:**
```yaml
services:
  server:
    image: stahln1/clipx:latest
    restart: always
    environment:
      - BASE_URL=http://localhost:3000         # Change this to your IP/Domain
      - API_KEY=your_secure_api_key            # Set a strong key here
      - DEBUG=false                            # Keep this set to false for production use
    volumes:
      - ./uploads:/app/uploads
    ports:
      - "3000:3000"
```

#### 2. Client Setup (Linux)

1. **Copy the `watcher.sh` script into a directory of your choice.**
```bash
curl -O https://raw.githubusercontent.com/stahl-n/ClipX/main/scripts/watcher.sh
# or alternatively
wget https://raw.githubusercontent.com/stahl-n/ClipX/main/scripts/watcher.sh
``` 

2. **Edit the `watcher.sh` file with your preferred text editor.**
- Change the API_KEY to the API key of your server configuration.
- Change the API_URL to your server's URL (e.g. http://localhost:3000/upload) - do NOT remove the /upload part!
- Change the WATCH_DIR to the folder for automatic uploads (e.g. where OBS saves your clips).

3. **Make the `watcher.sh` script executable and run it:**
```bash
chmod +x watcher.sh
./watcher.sh
```
Tip: Add this script to your "Startup Applications" to start it automatically on boot.

#### 2. Client Setup (Windows)
As of now, there is no Windows client available for ClipX, but you can create your
own script for Windows, if you still want to use ClipX.