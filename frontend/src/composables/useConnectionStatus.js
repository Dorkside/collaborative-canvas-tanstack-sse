import { ref, onMounted, onUnmounted } from 'vue';

export function useConnectionStatus() {
  const isOnline = ref(navigator.onLine);
  const lastConnectionEvent = ref(null);

  function updateOnlineStatus(event) {
    isOnline.value = navigator.onLine;
    lastConnectionEvent.value = event.type;
  }

  onMounted(() => {
    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);
  });

  onUnmounted(() => {
    window.removeEventListener('online', updateOnlineStatus);
    window.removeEventListener('offline', updateOnlineStatus);
  });

  return {
    isOnline,
    lastConnectionEvent
  };
} 