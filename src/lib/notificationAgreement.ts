import { requestNotificationAgreement } from '@apps-in-toss/web-framework';

const TEMPLATE_CODE = import.meta.env.VITE_AIT_NOTIFICATION_TEMPLATE_CODE as string | undefined;

export function requestWateringNotificationAgreement(): void {
  if (!TEMPLATE_CODE) return;
  const cleanup = requestNotificationAgreement({
    options: { templateCode: TEMPLATE_CODE },
    onEvent: () => {
      cleanup();
    },
    onError: (error: unknown) => {
      console.error('[notificationAgreement]', error);
      cleanup();
    },
  });
}
