import { ref, watch, onUnmounted } from 'vue';
import { useQuery, useMutation } from '@tanstack/vue-query';

export function useCanvasState(canvasId) {
    const lines = ref([]);
    const redoStack = ref([]);
    const currentDrawing = ref(null);

    // Fetch initial canvas state
    const { isPending, isFetching, isError, error, data, refetch } = useQuery({
        queryKey: ['canvas', canvasId],
        queryFn: async () => {
            const response = await fetch(`http://localhost:3000/canvas/${canvasId}`);
            const data = await response.json();
            lines.value = data.lines || [];
            return data;
        },
    });

    // Refetch when tab becomes visible
    const handleVisibilityChange = async () => {
        if (document.visibilityState === 'visible') {
            await refetch();
        }
    };

    if (typeof document !== 'undefined') {
        document.addEventListener('visibilitychange', handleVisibilityChange);
    }

    const mutation = useMutation({
        mutationFn: async (data) => {
            const response = await fetch(`http://localhost:3000/draw/${canvasId}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...data,
                    timestamp: Date.now()
                }),
            });
            const result = await response.json();
            return result;
        },
        onSuccess: (result) => {
            if (result.lines) {
                lines.value = [...result.lines];
            }
        }
    });

    // Subscribe to SSE for real-time updates
    const eventSource = new EventSource(`http://localhost:3000/events/${canvasId}`);
    eventSource.onmessage = (event) => {
        const data = JSON.parse(event.data);
        
        switch (data.type) {
            case 'undo':
            case 'redo':
            case 'sync':
                lines.value = Array.isArray(data.lines) ? [...data.lines] : [];
                redoStack.value = [];
                break;
            case 'draw':
                if (data.status === 'complete') {
                    lines.value = Array.isArray(data.lines) ? [...data.lines] : [];
                    redoStack.value = [];
                } else if (data.line.id !== currentDrawing.value?.id) {
                    currentDrawing.value = data.line;
                }
                break;
        }
    };

    // Clean up event listeners
    onUnmounted(() => {
        eventSource.close();
        if (typeof document !== 'undefined') {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        }
    });

    async function undo() {
        if (lines.value.length > 0) {
            try {
                await refetch();
                
                if (lines.value.length > 0) {
                    redoStack.value.push([...lines.value]);
                    const newLines = lines.value.slice(0, -1);
                    await mutation.mutateAsync({ 
                        type: 'undo',
                        lines: newLines
                    });
                }
            } catch (error) {
                console.error('Error during undo:', error);
            }
        }
    }

    async function redo() {
        if (redoStack.value.length > 0) {
            const nextState = redoStack.value.pop();
            
            await mutation.mutateAsync({ 
                type: 'redo',
                lines: nextState
            });
        }
    }

    function startLine(newLine) {
        currentDrawing.value = newLine;
        mutation.mutate({ 
            type: 'draw', 
            status: 'in-progress',
            line: newLine 
        });
    }

    function updateLine(updatedLine) {
        currentDrawing.value = updatedLine;
        mutation.mutate({ 
            type: 'draw', 
            status: 'in-progress',
            line: updatedLine 
        });
    }

    function completeLine(finalLine) {
        const newLines = [...lines.value, finalLine];
        lines.value = newLines;
        currentDrawing.value = null;

        mutation.mutate({ 
            type: 'draw', 
            status: 'complete',
            line: finalLine,
            lines: newLines
        });
    }

    return {
        lines,
        currentDrawing,
        isPending,
        isFetching,
        isError,
        error,
        startLine,
        updateLine,
        completeLine,
        undo,
        redo,
        canUndo: () => lines.value.length > 0,
        canRedo: () => redoStack.value.length > 0,
    };
}
