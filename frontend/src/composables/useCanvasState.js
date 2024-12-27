import { ref, watch, onUnmounted } from 'vue';
import { useQuery, useMutation } from '@tanstack/vue-query';

export function useCanvasState(canvasId) {
    const lines = ref([]);
    const redoStack = ref([]);
    const currentDrawing = ref(null);
    const isDrawing = ref(false);

    // Fetch initial canvas state
    const { isPending, isFetching, isError, error, data, refetch } = useQuery({
        queryKey: ['canvas', canvasId],
        queryFn: async () => {
            const response = await fetch(`http://localhost:3000/canvas/${canvasId}`);
            const data = await response.json();
            lines.value = data.lines || [];
            redoStack.value = [];
            // Only clear currentDrawing if we're not actively drawing
            if (!isDrawing.value) {
                currentDrawing.value = null;
            }
            return data;
        },
    });

    // Create a wrapper for refetch that also forces a lines update
    async function refetchState() {
        const result = await refetch();
        if (result.data?.lines) {
            lines.value = [...result.data.lines];
            redoStack.value = [];
            // Only clear currentDrawing if we're not actively drawing
            if (!isDrawing.value) {
                currentDrawing.value = null;
            }
        }
        return result;
    }

    // Update the visibility change handler to use refetchState
    const handleVisibilityChange = async () => {
        if (document.visibilityState === 'visible') {
            // Only clear currentDrawing if we're not actively drawing
            if (!isDrawing.value) {
                currentDrawing.value = null;
            }
            await refetchState();
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
                if (result.type !== 'redo') {
                    redoStack.value = [];
                }
            }
        }
    });

    // Subscribe to SSE for real-time updates
    const eventSource = new EventSource(`http://localhost:3000/events/${canvasId}`);
    eventSource.onmessage = (event) => {
        const data = JSON.parse(event.data);
        
        switch (data.type) {
            case 'undo':
            case 'sync':
                lines.value = Array.isArray(data.lines) ? [...data.lines] : [];
                redoStack.value = [];
                if (!isDrawing.value) {
                    currentDrawing.value = null;
                }
                break;
            case 'redo':
                lines.value = Array.isArray(data.lines) ? [...data.lines] : [];
                if (!isDrawing.value) {
                    currentDrawing.value = null;
                }
                break;
            case 'draw':
                if (data.status === 'complete') {
                    lines.value = Array.isArray(data.lines) ? [...data.lines] : [];
                    redoStack.value = [];
                    // Only clear if it's our drawing that completed
                    if (currentDrawing.value?.id === data.line.id) {
                        currentDrawing.value = null;
                        isDrawing.value = false;
                    }
                } else if (data.line.id !== currentDrawing.value?.id) {
                    // Only update other users' in-progress drawings
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
        isDrawing.value = true;
        currentDrawing.value = newLine;
        mutation.mutate({ 
            type: 'draw', 
            status: 'in-progress',
            line: newLine 
        });
    }

    function updateLine(updatedLine) {
        if (isDrawing.value) {
            currentDrawing.value = updatedLine;
            mutation.mutate({ 
                type: 'draw', 
                status: 'in-progress',
                line: updatedLine 
            });
        }
    }

    function completeLine(finalLine) {
        const newLines = [...lines.value, finalLine];
        lines.value = newLines;
        currentDrawing.value = null;
        isDrawing.value = false;

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
        refetchState,
    };
}
