# Collaborative Canvas with Vue 3, TanStack Query, Konva, and SSE

This tutorial will guide you through building a real-time collaborative drawing canvas using Vue 3, TanStack Query for server-side state management, Konva for a robust and feature-rich canvas API, and Server-Sent Events (SSE) for live updates. The server will maintain the canvas state in-memory only, eliminating the need for database persistence, making the project simpler and more focused.

## Overview

By the end of this tutorial, you will have built a fully functional collaborative drawing canvas while learning how to:

- Use Konva for building dynamic and interactive drawing canvases.
- Integrate TanStack Query with Vue 3 for managing server-side state.
- Implement Server-Sent Events (SSE) for real-time updates.
- Synchronize client actions with server-side state efficiently.

## Table of Contents

- [Target Audience](#target-audience)
- [Features](#features)
- [Technical Stack](#technical-stack)
  - [Frontend](#frontend)
  - [Backend](#backend)
- [Tutorial Outline](#tutorial-outline)
  - [1. Setting Up the Environment](#1-setting-up-the-environment)
  - [2. Building the Backend](#2-building-the-backend)
  - [3. Frontend: Setting Up Vue 3](#3-frontend-setting-up-vue-3)
  - [4. Adding Default State and Local Drawing](#4-adding-default-state-and-local-drawing)
  - [5. Making use of TanStack Query advanced features](#5-making-use-of-tanstack-query-advanced-features)
  - [6. Wrap-up: SSE vs Polling](#6-wrap-up-sse-vs-polling)
- [Getting the Source Code](#getting-the-source-code)

## Target Audience

- Intermediate web developers familiar with Vue 3, Node.js, and basic front-end concepts.
- Developers curious about Konva for advanced canvas functionality.
- Anyone looking to explore real-time data synchronization using SSE.

## Features

- **Shared Collaborative Canvas**: Multiple users can draw on the same canvas simultaneously with real-time updates.
- **Initial Canvas State**: New users see the existing canvas state upon joining the session, fetched using TanStack Query.
- **Real-Time Drawing Updates**: As users draw, their actions are broadcast to all connected clients via SSE.
- **Custom Drawing Tools**: Brush size, color selection, and eraser mode.
- **Server-Side State Management**: Canvas state is stored in-memory on the server, simplifying implementation while focusing on real-time interactions.

## Technical Stack

### Frontend

- Vue 3 with Composition API.
- TanStack Query for data fetching and state synchronization.
- Konva.js with Vue Konva for drawing functionality.
- SSE for real-time updates.

### Backend

- Node.js with Express for API and SSE endpoints.
- In-memory storage for managing the shared canvas state.

## Tutorial Outline

### 1. Setting Up the Environment

1. **Create the project structure:**

   ```sh
   mkdir frontend backend
   ```

2. **Initialize npm in both frontend and backend folders:**

   ```sh
   cd frontend
   npm init -y
   cd ../backend
   npm init -y
   cd ..
   ```

3. **Install dependencies for both frontend and backend:**

   - Frontend: `vue`, `@tanstack/vue-query`, `vue-konva`

     ```sh
     cd frontend
     npm install vue @tanstack/vue-query vue-konva
     cd ..
     ```

   - Backend: `express`, `cors`

     ```sh
     cd backend
     npm install express cors
     cd ..
     ```

4. **Set up the project structure with separate folders for frontend and backend.**

### 2. Building the Backend

1. **Create a Node.js server with the following:**

   - In-Memory State Management: Maintain the canvas state in a simple JavaScript object.
   - API for Canvas State: Endpoint to fetch the current canvas state.
   - SSE Endpoint: Push drawing events to all connected clients.

2. **Set up the backend server:**

   - Create a file named `server.js` in the `backend` folder:

     ```sh
     cd backend
     touch server.js
     ```

3. **Initialize the server and set up basic middleware:**

   - Add the following code to `server.js` to set up Express and CORS:

     ```javascript
     const express = require('express');
     const cors = require('cors');

     const app = express();
     const port = 3000;

     app.use(cors());
     app.use(express.json());
     ```

4. **Set up in-memory state management:**

   - Add the following code to manage the canvas state and listeners:

     ```javascript
     let canvasState = []; // Array of drawing actions (e.g., strokes)
     let canvasListeners = [];
     ```

5. **Create an endpoint to fetch the current canvas state:**

   - Add the following code to handle GET requests for the canvas state:

     ```javascript
     // Endpoint to fetch canvas state
     app.get('/canvas', (req, res) => {
       res.json(canvasState);
     });
     ```

   - **Testing Tip:** Visit `http://localhost:3000/canvas` in your browser. You should see an empty array `[]` or the default state if you have added any initial lines.

6. **Create an SSE endpoint for real-time updates:**

   - Add the following code to handle SSE connections and send updates:

     ```javascript
     // SSE endpoint for real-time updates
     app.get('/events', (req, res) => {
       res.setHeader('Content-Type', 'text/event-stream');
       res.setHeader('Cache-Control', 'no-cache');
       res.setHeader('Connection', 'keep-alive');

       // Send real-time updates when canvasState changes
       const sendUpdate = (data) => {
         res.write(`data: ${JSON.stringify(data)}\n\n`);
       };

       // Add listener for updates
       canvasListeners.push(sendUpdate);

       req.on('close', () => {
         canvasListeners = canvasListeners.filter((listener) => listener !== sendUpdate);
       });
     });
     ```

7. **Create an endpoint to receive drawing actions:**

   - Add the following code to handle POST requests for new drawing actions:

     ```javascript
     // Endpoint to receive drawing actions
     app.post('/draw', (req, res) => {
       const newAction = req.body;
       canvasState.push(newAction);
       canvasListeners.forEach((listener) => listener(newAction));
       res.status(201).end();
     });
     ```

8. **Start the server:**

   - Add the following code to start the server and listen on the specified port:

     ```javascript
     app.listen(port, () => {
       console.log(`Server running at http://localhost:${port}`);
     });
     ```

9. **Run the backend server:**

   ```sh
   node server.js
   ```

### 3. Frontend: Setting Up Vue 3

1. **Create a new Vue 3 project:**

   - Navigate to the `frontend` folder and create a new Vue 3 project:

     ```sh
     npm create vue@latest
     ```

   - Follow the prompts to set up the project. Choose the default preset or customize as needed. Call the project 'frontend', activate the router.

2. **Install TanStack Query and Vue Konva:**

   - Install the required dependencies:

     ```sh
     npm install @tanstack/vue-query vue-konva
     ```

3. **Set up TanStack Query and Vue Konva in the Vue project:**

   - Open `src/main.js` and add the following code to set up TanStack Query and Vue Konva:

     ```javascript
     import "./assets/main.css";

     import { createApp } from 'vue';
     import { VueQueryPlugin } from '@tanstack/vue-query';
     import VueKonva from 'vue-konva';
     import App from './App.vue';
     import router from './router';

     const app = createApp(App);

     app.use(VueQueryPlugin);
     app.use(VueKonva);
     app.use(router);

     app.mount('#app');
     ```

4. **Create the Canvas component:**

   - Create a new file named `Canvas.vue` in the `src/components` folder:

     ```sh
     touch src/components/Canvas.vue
     ```

5. **Create a file for server interactions:**

   - Create a new file named `useCanvasState.js` in the `src/composables` folder:

     ```sh
     mkdir src/composables
     touch src/composables/useCanvasState.js
     ```

6. **Add server interaction logic to `useCanvasState.js`:**

   - Add the following code to `useCanvasState.js`:

     ```javascript
     import { ref, watch } from 'vue';
     import { useQuery, useQueryClient } from '@tanstack/vue-query';

     export function useCanvasState() {
       const lines = ref([]);
       const queryClient = useQueryClient();

       // Fetch initial canvas state
       const { data: initialState, isPending, isFetching, isError, error } = useQuery({
         queryKey: ['canvas'],
         queryFn: () => fetch('http://localhost:3000/canvas').then((res) => res.json()),
       });

       // Watch for changes in initialState and update lines
       watch(initialState, (newState) => {
         if (newState) {
           lines.value = newState;
         }
       });

       // Subscribe to SSE for real-time updates
       const eventSource = new EventSource('http://localhost:3000/events');
       eventSource.onmessage = (event) => {
         const newLine = JSON.parse(event.data);
         lines.value = [...lines.value, newLine];
       };

       return {
         lines,
         isPending,
         isFetching,
         isError,
         error,
       };
     }
     ```

7. **Initialize the Canvas component:**

   - Add the following code to `Canvas.vue` to set up the basic structure:

     ```vue
     <template>
       <v-stage :config="{ width: 800, height: 600 }" @mousedown="startDrawing" @mouseup="endDrawing" @mousemove="draw">
         <v-layer>
           <v-line
             v-for="line in lines"
             :key="line.id"
             :config="line.config"
           />
         </v-layer>
       </v-stage>
     </template>

     <script setup>
     import { ref } from 'vue';
     import { useCanvasState } from '../composables/useCanvasState';

     const { lines } = useCanvasState();
     const isDrawing = ref(false);
     const currentLine = ref(null);

     function startDrawing(event) {
         isDrawing.value = true;
         const pos = event.target.getStage().getPointerPosition();
         currentLine.value = {
             id: Date.now(),
             config: {
                 points: [pos.x, pos.y],
                 stroke: 'black',
                 strokeWidth: 2,
             },
         };
         lines.value.push(currentLine.value);
     }

     function endDrawing() {
         isDrawing.value = false;
         addLine(currentLine.value);
         currentLine.value = null;
     }

     function draw(event) {
         if (!isDrawing.value) return;
         const pos = event.target.getStage().getPointerPosition();
         currentLine.value.config.points.push(pos.x, pos.y);
     }
     </script>
     ```

8. **Integrate the Canvas component into the main App:**

   - Open `src/App.vue` and update it to include the Canvas component:

     ```vue
     <script setup>
     import Canvas from './components/Canvas.vue';
     </script>

     <template>
       <div id="app">
         <Canvas />
       </div>
     </template>
     ```

9. **Run the frontend development server:**

   ```sh
   npm run dev
   ```

   - **Testing Tip:** Open `http://localhost:5173` in your browser. You should see the canvas with any initial lines drawn.

### 4. Adding Default State and Local Drawing

1. **Add a default state with some lines:**

   - Update the `canvasState` variable in `server.js` to include a default state with some lines:

     ```javascript
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
     ```

2. **Enable local drawing:**

   - Add the following code to `useCanvasState.js` to handle pushing new lines to the server:

     ```javascript
     import { ref, watch } from 'vue';
     import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query';

     export function useCanvasState() {
       const lines = ref([]);
       const queryClient = useQueryClient();

       // Fetch initial canvas state
       const { data: initialState, isPending, isFetching, isError, error } = useQuery({
         queryKey: ['canvas'],
         queryFn: () => fetch('http://localhost:3000/canvas').then((res) => res.json()),
       });

       // Watch for changes in initialState and update lines
       watch(initialState, (newState) => {
         if (newState) {
           lines.value = newState;
         }
       });

       // Subscribe to SSE for real-time updates
       const eventSource = new EventSource('http://localhost:3000/events');
       eventSource.onmessage = (event) => {
         const newLine = JSON.parse(event.data);
         lines.value.push(newLine);
       };

       // Function to add a new line and push to the server
       function addLine(newLine) {
         lines.value.push(newLine);
         mutation.mutate(newLine);
       }

       // Mutation to push new line to the server
       const mutation = useMutation({
         mutationFn: (newLine) => {
           return fetch('http://localhost:3000/draw', {
             method: 'POST',
             headers: {
               'Content-Type': 'application/json',
             },
             body: JSON.stringify(newLine),
           });
         },
         onSuccess: () => {
           queryClient.invalidateQueries(['canvas']);
         },
       });

       return {
         lines,
         isPending,
         isFetching,
         isError,
         error,
         addLine,
       };
     }
     ```

   - Update `Canvas.vue` to include the `@mousedown`, `@mouseup`, and `@mousemove` events:

     ```vue
     <template>
       <v-stage :config="{ width: 800, height: 600 }" @mousedown="startDrawing" @mouseup="endDrawing" @mousemove="draw">
         <v-layer>
           <v-line
             v-for="line in lines"
             :key="line.id"
             :config="line.config"
           />
         </v-layer>
       </v-stage>
     </template>

     <script setup>
     import { ref } from 'vue';
     import { useCanvasState } from '../composables/useCanvasState';

     const { lines, addLine } = useCanvasState();
     const isDrawing = ref(false);
     const currentLine = ref(null);

     function startDrawing(event) {
         isDrawing.value = true;
         const pos = event.target.getStage().getPointerPosition();
         currentLine.value = {
             id: Date.now(),
             config: {
                 points: [pos.x, pos.y],
                 stroke: 'black',
                 strokeWidth: 2,
             },
         };
         lines.value.push(currentLine.value);
     }

     function endDrawing() {
         isDrawing.value = false;
         addLine(currentLine.value);
         currentLine.value = null;
     }

     function draw(event) {
         if (!isDrawing.value) return;
         const pos = event.target.getStage().getPointerPosition();
         currentLine.value.config.points.push(pos.x, pos.y);
     }
     </script>
     ```

   - **Testing Tip:** Click and drag on the canvas to draw lines. Ensure that the lines appear as you draw.
  
### 5. Making use of TanStack Query advanced features

To enhance the user experience and make the application more robust, we can leverage some of TanStack Query's advanced features such as optimistic updates and error handling.

1. **Optimistic Updates**: This feature allows the UI to update immediately after a drawing action, even before the server confirms the action. This provides a smoother user experience.

2. **Error Handling**: Implement robust error handling to manage network issues or server errors gracefully.

3. **Query Invalidation**: Ensure that the canvas state is always fresh and consistent across all clients by invalidating queries after mutations.

Here is an example of how to implement these features in `useCanvasState.js`:

```javascript
import { ref, watch } from 'vue';
import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query';

export function useCanvasState() {
  const lines = ref([]);
  const queryClient = useQueryClient();

  // Fetch initial canvas state
  const { data: initialState, isPending, isFetching, isError, error } = useQuery({
    queryKey: ['canvas'],
    queryFn: () => fetch('http://localhost:3000/canvas').then((res) => res.json()),
  });

  // Mutation to push new line to the server with optimistic updates
  const mutation = useMutation({
    mutationFn: (newLine) => {
      return fetch('http://localhost:3000/draw', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newLine),
      });
    },
    onMutate: async (newLine) => {
      await queryClient.cancelQueries(['canvas']);
      const previousLines = queryClient.getQueryData(['canvas']);
      queryClient.setQueryData(['canvas'], (old) => [...old, newLine]);
      return { previousLines };
    },
    onError: (err, newLine, context) => {
      queryClient.setQueryData(['canvas'], context.previousLines);
    },
    onSettled: () => {
      queryClient.invalidateQueries(['canvas']);
    },
  });

  // Watch for changes in initialState and update lines
  watch(initialState, (newState) => {
    if (newState) {
      lines.value = newState;
    }
  });

  // Subscribe to SSE for real-time updates
  const eventSource = new EventSource('http://localhost:3000/events');
  eventSource.onmessage = (event) => {
    const newLine = JSON.parse(event.data);
    lines.value = [...lines.value, newLine];
  };

  // Function to add a new line and push to the server
  function addLine(newLine) {
    mutation.mutate(newLine);
  }

  return {
    lines,
    isPending,
    isFetching,
    isError,
    error,
    addLine,
  };
}
```

By implementing these features, you can ensure a more responsive and reliable collaborative drawing experience for your users.

### 6. Wrap-up: SSE vs Polling

When building real-time applications, SSE (Server-Sent Events) combined with TanStack Query offers significant benefits compared to a generic polling mechanism:

- **Immediate updates**: Polling requires repeated requests that can delay updates. SSE pushes new data automatically, letting the UI react faster.  
- **Reduced overhead**: A single persistent connection typically uses fewer resources than frequent polls, which improves scalability.  
- **Simplicity**: SSE is easier to implement for one-way communication than solutions like WebSockets, while still delivering near-instant updates.  
- **Better proxy compatibility**: SSE often works more reliably behind corporate proxies than WebSockets do, making it suitable for enterprise contexts.

### Potential Drawbacks
- **Browser support**: Although most modern browsers support SSE, older or less common environments may not.  
- **One-way limitation**: SSE flows data from server to client. Additional mechanisms may be needed for client-to-server commands if your app requires two-way communication.  

In many cases, these benefits justify the added complexity and learning curve, especially for applications that require frequent real-time updates without complicated bidirectional data flow.

## Why TanStack?
- **Flexible and Powerful**: TanStack Query handles complex data fetching scenarios with features like caching, invalidation, and optimistic updates.  
- **Declarative Approach**: Less boilerplate code for tracking request states. Simplifies data flow and state management.

## Getting the Source Code

If you prefer to get the source code directly and run the project without following the tutorial, you can clone the repository and install the dependencies:

1. **Clone the repository:**

   ```sh
   git clone https://github.com/your-username/collaborative-canvas-tanstack-sse.git
   cd collaborative-canvas-tanstack-sse
   ```

2. **Install dependencies for both frontend and backend:**

   ```sh
   cd frontend
   npm install
   cd ../backend
   npm install
   cd ..
   ```

3. **Run the backend server:**

   ```sh
   cd backend
   node server.js
   ```

4. **Run the frontend development server:**

   ```sh
   cd frontend
   npm run dev
   ```

5. **Open the application in your browser:**

   Visit `http://localhost:5173` to see the collaborative canvas in action.