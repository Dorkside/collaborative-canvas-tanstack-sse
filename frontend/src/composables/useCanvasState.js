import { ref, watch } from 'vue';
import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query';

export function useCanvasState(canvasId) {
    const lines = ref([]);
    const queryClient = useQueryClient();

    // Fetch initial canvas state
    const { data: initialState, isPending, isFetching, isError, error } = useQuery({
        queryKey: ['canvas', canvasId],
        queryFn: () => fetch(`http://localhost:3000/canvas/${canvasId}`).then((res) => res.json()),
    });

    // Mutation to push new line to the server with optimistic updates
    const mutation = useMutation({
        mutationFn: (newLine) => {
            return fetch(`http://localhost:3000/draw/${canvasId}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(newLine),
            });
        },
        onMutate: async (newLine) => {
            await queryClient.cancelQueries(['canvas', canvasId]);
            const previousLines = queryClient.getQueryData(['canvas', canvasId]);
            queryClient.setQueryData(['canvas', canvasId], (old) => [...old, newLine]);
            return { previousLines };
        },
        onError: (err, newLine, context) => {
            queryClient.setQueryData(['canvas', canvasId], context.previousLines);
        },
        onSettled: () => {
            queryClient.invalidateQueries(['canvas', canvasId]);
        },
    });

    // Watch for changes in initialState and update lines
    watch(initialState, (newState) => {
        if (newState) {
            lines.value = newState;
        }
    });

    // Subscribe to SSE for real-time updates
    const eventSource = new EventSource(`http://localhost:3000/events/${canvasId}`);
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
