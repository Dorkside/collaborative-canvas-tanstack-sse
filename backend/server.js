const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
app.use(cors());
app.use(bodyParser.json());

// Store canvases in memory (in production, you'd want to use a database)
const canvases = new Map();

// SSE clients for each canvas
const canvasClients = new Map();

// Helper to send updates to all clients subscribed to a specific canvas
function notifyCanvasClients(canvasId, data) {
    if (canvasClients.has(canvasId)) {
        const clients = canvasClients.get(canvasId);
        clients.forEach(client => {
            client.write(`data: ${JSON.stringify(data)}\n\n`);
        });
    }
}

// Get canvas state
app.get('/canvas/:canvasId', (req, res) => {
    const { canvasId } = req.params;
    const canvasData = canvases.get(canvasId) || [];
    res.json(canvasData);
});

// Add new line to canvas
app.post('/draw/:canvasId', (req, res) => {
    const { canvasId } = req.params;
    const newLine = req.body;

    if (!canvases.has(canvasId)) {
        canvases.set(canvasId, []);
    }

    const canvasData = canvases.get(canvasId);
    canvasData.push(newLine);
    
    // Notify all clients subscribed to this canvas
    notifyCanvasClients(canvasId, newLine);
    
    res.status(200).send();
});

// SSE endpoint for real-time updates
app.get('/events/:canvasId', (req, res) => {
    const { canvasId } = req.params;

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    // Initialize clients array for this canvas if it doesn't exist
    if (!canvasClients.has(canvasId)) {
        canvasClients.set(canvasId, new Set());
    }

    const clients = canvasClients.get(canvasId);
    clients.add(res);

    // Remove client on connection close
    req.on('close', () => {
        clients.delete(res);
        if (clients.size === 0) {
            canvasClients.delete(canvasId);
        }
    });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
