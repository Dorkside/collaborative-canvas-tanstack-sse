<template>
  <div class="canvas-container">
    <!-- Loading and error states -->
    <div v-if="isPending" class="status-message">Loading canvas...</div>
    <div v-else-if="isError" class="status-message error">
      Error loading canvas: {{ error?.message }}
      <button @click="retryLoad">Retry</button>
    </div>
    
    <!-- Canvas controls -->
    <div class="canvas-controls" v-if="!isPending && !isError">
      <div class="tool-group">
        <input type="color" v-model="currentColor" title="Brush color" />
        <input 
          type="range" 
          v-model.number="strokeWidth" 
          min="1" 
          max="20" 
          title="Brush size" 
        />
        <button @click="toggleEraser">
          {{ isEraser ? 'Brush' : 'Eraser' }}
        </button>
      </div>

      <div class="history-controls">
        <button 
          @click="undo" 
          :disabled="!canUndo"
          title="Undo (Ctrl+Z)"
        >
          Undo
        </button>
        <button 
          @click="redo" 
          :disabled="!canRedo"
          title="Redo (Ctrl+Y)"
        >
          Redo
        </button>
      </div>
    </div>

    <!-- Main canvas -->
    <v-stage 
      v-if="!isPending && !isError"
      :config="stageConfig" 
      @mousedown="startDrawing" 
      @mouseup="endDrawing" 
      @mousemove="draw"
      :key="canvasKey"
    >
      <v-layer>
        <v-line
          v-for="line in allLines"
          :key="line.id"
          :config="line.config"
        />
      </v-layer>
    </v-stage>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
import { useRoute } from 'vue-router';
import { useCanvasState } from '../composables/useCanvasState';

const route = useRoute();
const canvasId = computed(() => route.params.canvasId || 'default');
const canvasKey = ref(0);

const { 
  lines, 
  currentDrawing,
  undo, 
  redo, 
  canUndo, 
  canRedo,
  isPending,
  isError,
  error,
  startLine,
  updateLine,
  completeLine,
  refetchState,
} = useCanvasState(canvasId.value);

// Watch for changes in lines
watch(lines, () => {
  canvasKey.value++;
});

// Handle window focus and visibility changes
async function handleFocusChange() {
  if (document.hasFocus()) {
    await refetchState();
    canvasKey.value++;
  }
}

const isDrawing = ref(false);
const currentColor = ref('#000000');
const strokeWidth = ref(2);
const isEraser = ref(false);

const strokeColor = computed(() => {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'white' : 'black';
});

const allLines = computed(() => {
    const completedLines = lines.value || [];
    return currentDrawing.value 
        ? [...completedLines, currentDrawing.value] 
        : completedLines;
});

const stageConfig = computed(() => ({
  width: 800,
  height: 600,
  style: { border: '1px solid #ccc' }
}));

function startDrawing(event) {
    isDrawing.value = true;
    const pos = event.target.getStage().getPointerPosition();
    const newLine = {
        id: Date.now(),
        config: {
            points: [pos.x, pos.y],
            stroke: isEraser.value ? '#ffffff' : currentColor.value,
            strokeWidth: Number(strokeWidth.value),
            globalCompositeOperation: isEraser.value ? 'destination-out' : 'source-over',
        },
    };
    startLine(newLine);
}

function endDrawing() {
    if (!isDrawing.value) return;
    isDrawing.value = false;
    completeLine(currentDrawing.value);
}

function draw(event) {
    if (!isDrawing.value) return;
    const pos = event.target.getStage().getPointerPosition();
    const updatedLine = {
        ...currentDrawing.value,
        config: {
            ...currentDrawing.value.config,
            points: [...currentDrawing.value.config.points, pos.x, pos.y],
        },
    };
    updateLine(updatedLine);
}

function toggleEraser() {
  isEraser.value = !isEraser.value;
}

// Handle keyboard shortcuts
function handleKeyboard(event) {
  if (event.ctrlKey || event.metaKey) { // metaKey for Mac
    if (event.key === 'z') {
      event.preventDefault();
      if (event.shiftKey) {
        redo();
      } else {
        undo();
      }
    } else if (event.key === 'y') {
      event.preventDefault();
      redo();
    }
  }
}

onMounted(() => {
  window.addEventListener('keydown', handleKeyboard);
  window.addEventListener('focus', handleFocusChange);
});

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeyboard);
  window.removeEventListener('focus', handleFocusChange);
});
</script>

<style scoped>
.canvas-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  position: relative;
}

.canvas-controls {
  display: flex;
  justify-content: space-between;
  width: 100%;
  max-width: 800px;
  gap: 1rem;
  padding: 0.5rem;
  background: #f5f5f5;
  border-radius: 4px;
}

.tool-group, .history-controls {
  display: flex;
  gap: 1rem;
  align-items: center;
}

button {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 4px;
  background: #42b883;
  color: white;
  cursor: pointer;
  transition: opacity 0.2s;
}

button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

button:not(:disabled):hover {
  opacity: 0.9;
}

.status-message {
  padding: 1rem;
  text-align: center;
}

.error {
  color: red;
}
</style>