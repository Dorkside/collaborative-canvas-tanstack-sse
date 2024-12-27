<template>
    <v-stage :config="{ width: 800, height: 600 }" @mousedown="startDrawing" @mouseup="endDrawing" @mousemove="draw">
        <v-layer>
            <v-line v-for="line in allLines" :key="line.id" :config="line.config" />
        </v-layer>
    </v-stage>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { useCanvasState } from '../composables/useCanvasState';

const route = useRoute();
const canvasId = computed(() => route.params.canvasId || 'default');
const { lines, addLine } = useCanvasState(canvasId.value);
const isDrawing = ref(false);
const currentLine = ref(null);

const strokeColor = computed(() => {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'white' : 'black';
});

const allLines = computed(() => {
    return currentLine.value ? [...lines.value, currentLine.value] : lines.value;
});

function startDrawing(event) {
    isDrawing.value = true;
    const pos = event.target.getStage().getPointerPosition();
    currentLine.value = {
        id: Date.now(),
        config: {
            points: [pos.x, pos.y],
            stroke: strokeColor.value,
            strokeWidth: 2,
        },
    };
}

function endDrawing() {
    isDrawing.value = false;
    addLine(currentLine.value);
    currentLine.value = null;
}

function draw(event) {
    if (!isDrawing.value) return;
    const pos = event.target.getStage().getPointerPosition();
    currentLine.value.config.points = [...currentLine.value.config.points, pos.x, pos.y];
}
</script>