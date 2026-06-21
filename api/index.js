import express from 'express';
import multer from 'multer';
import net from 'net';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const app = express();
const upload = multer();

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Serverless explicitly serving the public HTML homepage
app.get('/', (req, res) => {
    const indexPath = path.join(__dirname, '../public/index.html');
    if (fs.existsSync(indexPath)) {
        res.sendFile(indexPath);
    } else {
        res.status(404).send('Frontend index.html file not found in public/ directory.');
    }
});

// Handling payload transmission processes
app.post('/send', upload.single('file'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ status: 'error', message: 'No file uploaded.' });
    }

    const { host, port } = req.body;
    const fileData = req.file.buffer;
    const targetPort = parseInt(port);

    const client = new net.Socket();
    client.setTimeout(5000); 

    client.connect(targetPort, host, () => {
        client.write(fileData, () => {
            res.json({ status: 'success', message: `Sent ${fileData.length} bytes to ${host}:${targetPort}` });
            client.end();
        });
    });

    client.on('error', (err) => {
        res.json({ status: 'error', message: `Socket Error: ${err.message}` });
        client.destroy();
    });

    client.on('timeout', () => {
        res.json({ status: 'error', message: 'Connection timed out. Target unreachable.' });
        client.destroy();
    });
});

export default app;
