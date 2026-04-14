import { ref, onMounted, computed } from 'vue';
import { useRoute } from '#app';

export function useTicketLogin() {
  const route = useRoute();
  const isTicketProcessing = ref(false);
  const ticketError = ref('');

  const hasTicketInUrl = computed(() => !!route.query.ticket);

  const checkTicketStatus = () => {
    if (process.client) {
      isTicketProcessing.value = sessionStorage.getItem('ticket_processing') === 'true';
      const failed = sessionStorage.getItem('ticket_login_failed') === 'true';
      if (failed) {
        ticketError.value = 'Ticket authentication failed. Please try again via the portal.';
      }
    }
  };

  onMounted(() => {
    checkTicketStatus();
    
    // Listen for storage events in case the plugin updates flags
    window.addEventListener('storage', (e) => {
      if (e.key === 'ticket_processing' || e.key === 'ticket_login_failed') {
        checkTicketStatus();
      }
    });

    // Also listen for custom events if the plugin dispatches them
    window.addEventListener('ticket-processing-start', () => {
      isTicketProcessing.value = true;
      ticketError.value = '';
    });

    window.addEventListener('ticket-processing-end', (e) => {
      isTicketProcessing.value = false;
      if (e.detail?.error) {
        ticketError.value = e.detail.error;
      }
    });
  });

  return {
    isTicketProcessing,
    ticketError,
    hasTicketInUrl
  };
}
