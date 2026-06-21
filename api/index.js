import express from 'express';
import multer from 'multer';
import net from 'net';
import path from 'path';

const app = express();
const upload = multer(); // Store file in memory buffer instead of disk

// Route handling sending process
app.post('/send', upload.single('file'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ status: 'error', message: 'No file uploaded.' });
    }

    const { host, port } = req.body;
    const fileData = req.file.buffer;
    const targetPort = parseInt(port);

    const client = new net.Socket();

    // Set a strict timeout for serverless environments
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
