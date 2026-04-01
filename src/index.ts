import Fastify from 'fastify';
import multipart from '@fastify/multipart';
import fastifyStatic from '@fastify/static';
import fs from 'fs';
import path from 'path';
import { pipeline } from 'stream';
import { promisify } from 'util';
import { randomBytes } from 'crypto';

import "@fastify/multipart";

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
// Make sure to set your own API key in docker-compose.yml before running the server in production!
const API_KEY = process.env.API_KEY;
const DEBUG_MODE = process.env.DEBUG_MODE === 'true' || false;

// This defines, where the uploaded files will be stored on the server. 
// Do not change, unless you know what you are doing.
const UPLOADS_PATH = path.join(process.cwd(), 'uploads');

if (!fs.existsSync(UPLOADS_PATH)) {
    fs.mkdirSync(UPLOADS_PATH);
}
if (!API_KEY) {
    console.warn("Warning: No API key set! Please set the API_KEY environment variable to a strong key to prevent unauthorized uploads. Everyone with this key can upload files to your server!");
    process.exit(1);
}
const pump = promisify(pipeline);

const server = Fastify({
  //Only log if debug mode is enabled
  // In production, logging is disabled to improve performance and prevent sensitive data from being logged.
    logger: DEBUG_MODE ? {
        level: 'info',
        serializers: {
            req(request) {
                return { method: request.method, url: request.url }; // IPs are not logged
            }
        }
    } : false
});

// Register Plugins
server.register(multipart, {
  limits: {
    fileSize: 512 * 1024 * 1024, // 512 MB file size limit
  }
});

server.register(fastifyStatic, {
    root: UPLOADS_PATH, 
    prefix: '/view/',
});

// Upload Endpoint
server.post('/upload', async (request, reply) => {

    // API Authentication
    const apiKey = request.headers['x-api-key'];
    if (!apiKey || apiKey !== API_KEY) {
        server.log.warn('Unauthorized upload attempt with API key: ' + apiKey);
        return reply.status(401).send({ error: 'Unauthorized' });
    }

    const data = await request.file();
    if (!data) return reply.status(400).send({ error: 'No file' });

    // Generate a unique filename to prevent collisions
    const randomId = randomBytes(4).toString('hex');
    const extension = path.extname(data.filename) || '.mp4';
    const newFilename = `${randomId}${extension}`;
    const uploadPath = path.join(UPLOADS_PATH, newFilename);

    // Ensure the stream is fully drained
    await pump(data.file, fs.createWriteStream(uploadPath));

    // Log the file size for debugging
    const stats = fs.statSync(uploadPath);
    server.log.info(`Uploaded file size: ${stats.size} bytes`);

    if (stats.size < 1000) {
        server.log.warn("Warning: Uploaded file is extremely small! It is probably not a valid video file. Please check the source of the upload.");
    }

    return { url: `${BASE_URL}/watch/${newFilename}` };
});

// Web Video Player Endpoint
server.get('/watch/:clipId', async (request, reply) => {
    const { clipId } = request.params as { clipId: string };
    const filename = clipId.endsWith('.mp4') ? clipId : `${clipId}.mp4`;
    const filePath = path.join(UPLOADS_PATH, filename);

    if (!fs.existsSync(filePath)) {
        return reply.status(404).send('Clip not found');
    }

    // A very minimalistic HTML page to play the video.
    const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>ClipX - ${filename}</title>
        <style>
            body { margin: 0; background: #0a0a0a; display: flex; align-items: center; justify-content: center; height: 100vh; font-family: sans-serif; }
            .container { width: 100%; max-width: 1200px; padding: 20px; text-align: center; }
            video { width: 100%; border-radius: 8px; box-shadow: 0 10px 30px rgba(0,0,0,0.5); border: 1px solid #333; background: #000; }
        </style>
    </head>
    <body>
        <div class="container">
            <video controls autoplay playsinline>
                <source src="/view/${filename}" type="video/mp4">
                Your browser does not support the video tag.
            </video>
        </div>
    </body>
    </html>
    `;

    return reply.type('text/html').send(html);
});

const start = async () => {
    try {
        await server.listen({ port: 3000, host: '0.0.0.0' });
    } catch (err) {
        server.log.error(err);
        process.exit(1);
    }
};

start();