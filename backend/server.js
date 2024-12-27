const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
app.use(cors());
app.use(bodyParser.json());

// Store canvases and their history in memory
const canvases = new Map();
const canvasHistory = new Map();
const canvasClients = new Map();

// Initialize canvas if it doesn't exist
function initializeCanvas(canvasId) {
    if (!canvases.has(canvasId)) {
        canvases.set(canvasId, {
            lines: []
        });
    }
}

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
    initializeCanvas(canvasId);
    const canvasData = canvases.get(canvasId);
    res.json(canvasData);
});

// Add new line to canvas
app.post('/draw/:canvasId', (req, res) => {
    const { canvasId } = req.params;
    const data = req.body;
    
    initializeCanvas(canvasId);
    const canvas = canvases.get(canvasId);

    if (data.type === 'undo' || data.type === 'redo') {
        canvas.lines = [...data.lines];
        
        notifyCanvasClients(canvasId, {
            type: 'sync',
            lines: canvas.lines,
            timestamp: data.timestamp
        });

        // Send response with updated state
        res.json({ lines: canvas.lines });
    } else if (data.type === 'draw') {
        if (data.status === 'complete') {
            canvas.lines = [...data.lines];
        }
        
        notifyCanvasClients(canvasId, {
            type: 'draw',
            status: data.status,
            line: data.line,
            lines: canvas.lines,
            timestamp: data.timestamp
        });

        // Send response with updated state
        res.json({ lines: canvas.lines });
    }
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
