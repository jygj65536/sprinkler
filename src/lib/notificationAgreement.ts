import { requestNotificationAgreement } from '@apps-in-toss/web-framework';

const TEMPLATE_CODE = import.meta.env.VITE_AIT_NOTIFICATION_TEMPLATE_CODE as string | undefined;

export function requestWateringNotificationAgreement(): void {
  if (!TEMPLATE_CODE) return;
  requestNotificationAgreement({
    options: { templateCode: TEMPLATE_CODE },
    onEvent: () => {},
    onError: () => {},
  });
}
