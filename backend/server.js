const express = require("express");
const cors = require("cors");

const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());

let canvasState = [
  {
    id: 1,
    config: {
      points: [50, 60, 70, 80],
      stroke: 'red',
      strokeWidth: 5,
    },
  },
  {
    id: 2,
    config: {
      points: [100, 120, 130, 150],
      stroke: 'blue',
      strokeWidth: 5,
    },
  },
]; // Array of drawing actions (e.g., strokes)
let canvasListeners = [];

// Endpoint to fetch canvas state
app.get("/canvas", (req, res) => {
  res.json(canvasState);
});

// SSE endpoint for real-time updates
app.get("/events", (req, res) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  // Send real-time updates when canvasState changes
  const sendUpdate = (data) => {
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  };

  // Add listener for updates
  canvasListeners.push(sendUpdate);

  req.on("close", () => {
    canvasListeners = canvasListeners.filter(
      (listener) => listener !== sendUpdate
    );
  });
});

// Endpoint to receive drawing actions
app.post("/draw", (req, res) => {
  const newAction = req.body;
  canvasState.push(newAction);
  canvasListeners.forEach((listener) => listener(newAction));
  res.status(201).end();
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
